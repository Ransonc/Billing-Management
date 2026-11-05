import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 收支记录列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const month = searchParams.get('month');

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (type) where.type = type;
    if (category) where.category = category;
    if (month) {
      const [y, m] = month.split('-').map(Number);
      where.recordDate = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    const [items, total, incomeAgg, expenseAgg] = await Promise.all([
      prisma.financeRecord.findMany({
        where,
        orderBy: { recordDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.financeRecord.count({ where }),
      prisma.financeRecord.aggregate({
        where: { ...where, type: 'income' },
        _sum: { amount: true },
      }),
      prisma.financeRecord.aggregate({
        where: { ...where, type: 'expense' },
        _sum: { amount: true },
      }),
    ]);

    return jsonResponse({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalIncome: Number(incomeAgg._sum.amount || 0),
      totalExpense: Number(expenseAgg._sum.amount || 0),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取收支记录失败', 500);
  }
}

// 录入收支
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.type || !body.category || body.amount == null || !body.recordDate) {
      return errorResponse('类型、分类、金额、日期不能为空');
    }
    if (body.type !== 'income' && body.type !== 'expense') {
      return errorResponse('类型非法');
    }
    const amount = Number(body.amount);
    if (amount <= 0) return errorResponse('金额必须大于 0');

    const record = await prisma.financeRecord.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        type: body.type,
        category: body.category,
        amount,
        description: body.description || null,
        recordDate: new Date(body.recordDate),
        relatedId: body.relatedId || null,
        relatedType: body.relatedType || null,
        operatorId: ctx.userId,
      },
    });

    await createAuditLog({ ctx, action: 'create', module: 'finance', targetId: record.id });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '录入失败', 500);
  }
}

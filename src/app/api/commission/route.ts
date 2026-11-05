import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { calculateCommission } from '@/server/calculations';
import { DEFAULT_COMMISSION_RATE, ROLES } from '@/lib/constants';

// 月度提成汇总:员工当月销售额 + 已生成的提成分录
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const periodMonth =
      searchParams.get('month') || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [y, m] = periodMonth.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 1);

    const employees = await prisma.user.findMany({
      where: { ...buildEnterpriseWhere(ctx), role: ROLES.EMPLOYEE, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    const sales = await prisma.drugSale.findMany({
      where: {
        ...buildEnterpriseWhere(ctx),
        operatorId: { in: employees.map((e) => e.id) },
        saleDate: { gte: monthStart, lt: monthEnd },
      },
      select: { operatorId: true, totalAmount: true },
    });

    const salesMap = new Map<string, number>();
    for (const s of sales) {
      if (!s.operatorId) continue;
      salesMap.set(s.operatorId, (salesMap.get(s.operatorId) || 0) + Number(s.totalAmount));
    }

    const records = await prisma.commissionRecord.findMany({
      where: { ...buildEnterpriseWhere(ctx), periodMonth },
    });
    const recordMap = new Map(records.map((r) => [r.userId, r]));

    const items = employees.map((e) => {
      const record = recordMap.get(e.id);
      return {
        userId: e.id,
        userName: e.name,
        email: e.email,
        salesAmount: Number((salesMap.get(e.id) || 0).toFixed(2)),
        commissionRecord: record
          ? {
              id: record.id,
              commissionRate: Number(record.commissionRate || 0),
              commissionAmount: Number(record.commissionAmount),
              status: record.status,
            }
          : null,
      };
    });

    return jsonResponse({ periodMonth, items });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取提成数据失败', 500);
  }
}

// 生成/重算某个员工的月度提成分录
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.userId || !body.periodMonth) {
      return errorResponse('员工和月份不能为空');
    }
    const rate = Number(body.rate ?? DEFAULT_COMMISSION_RATE);
    const [y, m] = body.periodMonth.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 1);

    const agg = await prisma.drugSale.aggregate({
      where: {
        ...buildEnterpriseWhere(ctx),
        operatorId: body.userId,
        saleDate: { gte: monthStart, lt: monthEnd },
      },
      _sum: { totalAmount: true },
    });
    const salesAmount = Number(agg._sum.totalAmount || 0);
    const commissionAmount = calculateCommission(salesAmount, rate);

    const existing = await prisma.commissionRecord.findUnique({
      where: {
        enterpriseId_userId_periodMonth: {
          enterpriseId: ctx.enterpriseId!,
          userId: body.userId,
          periodMonth: body.periodMonth,
        },
      },
    });

    // 已发放的不允许重算
    if (existing?.status === 'paid') {
      return errorResponse('该提成本月已发放,不能修改');
    }

    const record = existing
      ? await prisma.commissionRecord.update({
          where: { id: existing.id },
          data: { salesAmount, commissionRate: rate, commissionAmount, status: 'pending' },
        })
      : await prisma.commissionRecord.create({
          data: {
            enterpriseId: ctx.enterpriseId!,
            userId: body.userId,
            periodMonth: body.periodMonth,
            salesAmount,
            commissionRate: rate,
            commissionAmount,
            status: 'pending',
          },
        });

    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '生成提成失败', 500);
  }
}

// 确认 / 发放提成
export async function PATCH(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    if (!body.recordId || !body.action) return errorResponse('参数不完整');

    const existing = await prisma.commissionRecord.findUnique({
      where: { id: body.recordId },
      select: { enterpriseId: true, status: true },
    });
    if (!existing) return errorResponse('提成分录不存在', 404);
    if (ctx.role !== ROLES.SUPER_ADMIN && existing.enterpriseId !== ctx.enterpriseId) {
      return errorResponse('FORBIDDEN');
    }

    let data: Record<string, unknown> = {};
    if (body.action === 'confirm') {
      data = { status: 'confirmed', confirmedAt: new Date() };
    } else if (body.action === 'pay') {
      data = { status: 'paid', paidAt: new Date() };
    } else {
      return errorResponse('未知操作');
    }

    const record = await prisma.commissionRecord.update({
      where: { id: body.recordId },
      data,
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '操作失败', 500);
  }
}

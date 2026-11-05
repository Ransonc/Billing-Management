import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 欠款单列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const all = searchParams.get('all') === '1';

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (all) {
      const items = await prisma.debt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      });
      return jsonResponse({ items });
    }

    const [items, total, agg] = await Promise.all([
      prisma.debt.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          _count: { select: { payments: true } },
        },
      }),
      prisma.debt.count({ where }),
      prisma.debt.aggregate({
        where: { ...buildEnterpriseWhere(ctx), status: { not: 'settled' } },
        _sum: { remainingAmount: true },
      }),
    ]);

    return jsonResponse({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      totalRemaining: Number(agg._sum.remainingAmount || 0),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取欠款列表失败', 500);
  }
}

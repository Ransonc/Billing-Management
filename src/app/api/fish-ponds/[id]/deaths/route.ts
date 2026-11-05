import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 每日损耗列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const pond = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, pond?.enterpriseId);

    const items = await prisma.dailyDeath.findMany({
      where: { fishPondId: id },
      orderBy: { deathDate: 'desc' },
    });
    const totalDeaths = items.reduce((s, r) => s + r.quantity, 0);
    const stockAgg = await prisma.fishStocking.aggregate({
      where: { fishPondId: id },
      _sum: { quantity: true },
    });
    const totalStock = stockAgg._sum.quantity || 0;
    const deathRate = totalStock > 0 ? Number(((totalDeaths / totalStock) * 100).toFixed(1)) : 0;
    return jsonResponse({ items, totalDeaths, totalStock, deathRate });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取损耗记录失败', 500);
  }
}

// 录入损耗
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const pond = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, pond?.enterpriseId);

    const body = await request.json();
    if (!body.deathDate || !body.quantity) {
      return errorResponse('日期和死亡数量不能为空');
    }

    const record = await prisma.dailyDeath.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: id,
        deathDate: new Date(body.deathDate),
        quantity: Number(body.quantity),
        reason: body.reason || null,
        notes: body.notes || null,
      },
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '录入损耗失败', 500);
  }
}

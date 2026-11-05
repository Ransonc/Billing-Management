import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { MARKET_TREND_RANGES } from '@/lib/constants';

// 品种历史价格趋势(按日期升序,供图表使用)
export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    if (!species) return errorResponse('品种不能为空');

    const days = Number(searchParams.get('days') || 30);
    const allowedDays = MARKET_TREND_RANGES as readonly number[];
    const rangeDays = allowedDays.includes(days) ? days : 30;

    const start = new Date();
    start.setDate(start.getDate() - rangeDays);
    start.setHours(0, 0, 0, 0);

    const items = await prisma.marketPrice.findMany({
      where: { species, priceDate: { gte: start } },
      orderBy: { priceDate: 'asc' },
    });

    return jsonResponse({ items, days: rangeDays });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '历史行情加载失败', 500);
  }
}

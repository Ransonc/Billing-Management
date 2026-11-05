import { prisma } from '@/lib/db/prisma';
import { requireSuperAdmin } from '@/server/permissions';
import { getTodayRange } from '@/lib/utils';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 平台概览统计接口(仅超管可访问)
export async function GET() {
  try {
    // 权限校验
    const ctx = await requireSuperAdmin();
    void ctx;

    const { start: todayStart } = getTodayRange();

    // 并行查询所有统计数据
    const [
      totalEnterprises,
      totalUsers,
      todayNewEnterprises,
      pendingEnterprises,
      activeEnterprises,
      latestPrices,
    ] = await Promise.all([
      prisma.enterprise.count(),
      prisma.user.count(),
      prisma.enterprise.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.enterprise.count({ where: { status: 'pending' } }),
      prisma.enterprise.count({ where: { status: 'active' } }),
      prisma.marketPrice.findMany({
        orderBy: { priceDate: 'desc' },
        take: 5,
      }),
    ]);

    return jsonResponse({
      totalEnterprises,
      totalUsers,
      todayNewEnterprises,
      pendingEnterprises,
      activeEnterprises,
      systemAvailability: 98.5, // 可后续接监控
      latestPrices,
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取统计失败', 500);
  }
}

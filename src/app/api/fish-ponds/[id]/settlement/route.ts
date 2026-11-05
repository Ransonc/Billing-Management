import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { calculateCycleSummary, type CycleSummary } from '@/server/calculations';

// 养殖周期自动结算:投入/产出/利润/死亡率
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const pond = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true, name: true },
    });
    assertEnterpriseAccess(ctx, pond?.enterpriseId);

    const [stockingAgg, feedAgg, drugAgg, saleAgg, deathAgg, otherFinance] =
      await Promise.all([
        prisma.fishStocking.aggregate({
          where: { fishPondId: id },
          _sum: { totalCost: true, quantity: true },
        }),
        prisma.feedRecord.aggregate({
          where: { fishPondId: id },
          _sum: { totalCost: true },
        }),
        prisma.drugRecord.aggregate({
          where: { fishPondId: id },
          _sum: { cost: true },
        }),
        prisma.saleRecord.aggregate({
          where: { fishPondId: id },
          _sum: { totalAmount: true, quantity: true, weight: true },
        }),
        prisma.dailyDeath.aggregate({
          where: { fishPondId: id },
          _sum: { quantity: true },
        }),
        // 其他成本(如人工/水电,如有记账关联)
        prisma.financeRecord.aggregate({
          where: { enterpriseId: ctx.enterpriseId!, type: 'expense', relatedType: 'fish_pond', relatedId: id },
          _sum: { amount: true },
        }),
      ]);

    const summary: CycleSummary = calculateCycleSummary({
      stockingCost: Number(stockingAgg._sum.totalCost || 0),
      feedCost: Number(feedAgg._sum.totalCost || 0),
      drugCost: Number(drugAgg._sum.cost || 0),
      otherCost: Number(otherFinance._sum.amount || 0),
      totalSaleRevenue: Number(saleAgg._sum.totalAmount || 0),
      totalStockQuantity: stockingAgg._sum.quantity || 0,
      totalSaleQuantity: saleAgg._sum.quantity || 0,
      totalSaleWeight: Number(saleAgg._sum.weight || 0),
    });

    return jsonResponse({
      pondName: pond?.name,
      summary,
      details: {
        totalDeaths: deathAgg._sum.quantity || 0,
      },
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '周期结算失败', 500);
  }
}

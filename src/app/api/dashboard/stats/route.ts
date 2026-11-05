import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { calculateProfitChain, detectConsumptionAnomaly } from '@/server/calculations';
import { getTodayRange, getMonthRange, calculateGrowthRate } from '@/lib/utils';
import { FINANCE_CATEGORIES, ROLES } from '@/lib/constants';

// 老板经营驾驶舱聚合数据
export async function GET() {
  try {
    const ctx = await requireAuth();
    const where = buildEnterpriseWhere(ctx);
    const today = getTodayRange();
    const month = getMonthRange(0);
    const lastMonth = getMonthRange(-1);

    // ---- 销售(drugSale 口径,应收) ----
    const [todaySalesAgg, monthSalesAgg, lastMonthSalesAgg] = await Promise.all([
      prisma.drugSale.aggregate({
        where: { ...where, saleDate: { gte: today.start, lte: today.end } },
        _sum: { totalAmount: true },
      }),
      prisma.drugSale.aggregate({
        where: { ...where, saleDate: { gte: month.start, lte: month.end } },
        _sum: { totalAmount: true },
      }),
      prisma.drugSale.aggregate({
        where: { ...where, saleDate: { gte: lastMonth.start, lte: lastMonth.end } },
        _sum: { totalAmount: true },
      }),
    ]);

    // ---- 财务口径利润链(本月) ----
    const monthFinance = await prisma.financeRecord.findMany({
      where: { ...where, recordDate: { gte: month.start, lte: month.end } },
      select: { type: true, category: true, amount: true },
    });
    const expenseByCat = new Map<string, number>();
    let salesRevenue = 0;
    for (const r of monthFinance) {
      const amt = Number(r.amount);
      if (r.type === 'income' && r.category === FINANCE_CATEGORIES.SALES) salesRevenue += amt;
      if (r.type === 'expense') expenseByCat.set(r.category, (expenseByCat.get(r.category) || 0) + amt);
    }
    const profitChain = calculateProfitChain({
      salesRevenue,
      costOfGoods: expenseByCat.get(FINANCE_CATEGORIES.DRUG_PURCHASE) || 0,
      commission: expenseByCat.get(FINANCE_CATEGORIES.COMMISSION) || 0,
      fixedExpenses:
        [...expenseByCat.entries()]
          .filter(([c]) => c !== FINANCE_CATEGORIES.DRUG_PURCHASE && c !== FINANCE_CATEGORIES.COMMISSION)
          .reduce((s, [, v]) => s + v, 0),
    });

    // ---- 欠款 ----
    const unsettledDebts = await prisma.debt.findMany({
      where: { ...where, status: { not: 'settled' } },
      select: { customerId: true, remainingAmount: true },
    });
    const pendingDebt = unsettledDebts.reduce((s, d) => s + Number(d.remainingAmount), 0);
    const debtCustomerCount = new Set(unsettledDebts.map((d) => d.customerId)).size;

    // ---- 库存预警 ----
    const drugs = await prisma.drugInventory.findMany({
      where: { ...where, status: 'active' },
      select: { stockQuantity: true, safetyStock: true },
    });
    const lowStockDrugs = drugs.filter((d) => d.stockQuantity <= d.safetyStock).length;

    // ---- 水质异常(今日) ----
    const abnormalWaterQuality = await prisma.waterQualityRecord.count({
      where: { ...where, abnormal: true, recordDate: { gte: today.start, lte: today.end } },
    });

    // ---- 员工 ----
    const [employeeTotal, checkedInAgg, fieldWorkerCount, visitCount] = await Promise.all([
      prisma.user.count({ where: { ...where, role: ROLES.EMPLOYEE, isActive: true } }),
      prisma.attendance.findMany({
        where: { ...where, date: { gte: today.start, lte: today.end } },
        select: { userId: true },
      }),
      prisma.fieldTrack.count({ where: { ...where, status: 'active' } }),
      prisma.customerVisit.count({
        where: { ...where, startTime: { gte: today.start } },
      }),
    ]);

    // ---- 客户消费异常(本月 vs 上月) ----
    const [thisMonthByCustomer, lastMonthByCustomer] = await Promise.all([
      prisma.drugSale.groupBy({
        by: ['customerId'],
        where: { ...where, saleDate: { gte: month.start, lte: month.end }, customerId: { not: null } },
        _sum: { totalAmount: true },
      }),
      prisma.drugSale.groupBy({
        by: ['customerId'],
        where: { ...where, saleDate: { gte: lastMonth.start, lte: lastMonth.end }, customerId: { not: null } },
        _sum: { totalAmount: true },
      }),
    ]);
    const lastMap = new Map(lastMonthByCustomer.map((g) => [g.customerId, Number(g._sum.totalAmount || 0)]));
    let abnormalCustomers = 0;
    for (const g of thisMonthByCustomer) {
      if (!g.customerId) continue;
      const { isAbnormal } = detectConsumptionAnomaly(
        Number(g._sum.totalAmount || 0),
        lastMap.get(g.customerId) || 0
      );
      if (isAbnormal) abnormalCustomers += 1;
    }

    const monthSales = Number(monthSalesAgg._sum.totalAmount || 0);
    const lastMonthSales = Number(lastMonthSalesAgg._sum.totalAmount || 0);

    return jsonResponse({
      todaySales: Number(todaySalesAgg._sum.totalAmount || 0),
      monthSales,
      monthGrossProfit: profitChain.grossProfit,
      monthNetProfit: profitChain.netProfit,
      pendingDebt: Number(pendingDebt.toFixed(2)),
      debtCustomerCount,
      lowStockDrugs,
      abnormalWaterQuality,
      abnormalCustomers,
      employeeCheckedIn: new Set(checkedInAgg.map((a) => a.userId)).size,
      employeeTotal,
      fieldWorkers: fieldWorkerCount,
      todayVisits: visitCount,
      salesTrend: {
        current: monthSales,
        change: calculateGrowthRate(monthSales, lastMonthSales),
      },
      profitTrend: {
        current: profitChain.netProfit,
        change: 0,
      },
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '驾驶舱数据加载失败', 500);
  }
}

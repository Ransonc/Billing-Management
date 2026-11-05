import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { calculateProfitChain } from '@/server/calculations';
import { FINANCE_CATEGORIES } from '@/lib/constants';

type Period = 'day' | 'week' | 'month' | 'year';

function getRange(period: Period, baseDate?: string): { start: Date; end: Date; label: string } {
  const now = baseDate ? new Date(baseDate + 'T00:00:00') : new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  if (period === 'day') {
    return { start: new Date(y, m, d), end: new Date(y, m, d, 23, 59, 59), label: `${y}-${m + 1}-${d}` };
  }
  if (period === 'year') {
    return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59), label: `${y}年` };
  }
  if (period === 'month') {
    return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0, 23, 59, 59), label: `${y}年${m + 1}月` };
  }
  // week: 周一开始
  const day = now.getDay(); // 0=周日
  const offsetToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(y, m, d + offsetToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59);
  return { start: monday, end: sunday, label: '本周' };
}

// 利润链报表:销售收入 → 商品成本 → 毛利润 → 提成/支出 → 净利润
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as Period) || 'month';
    const date = searchParams.get('date') || undefined;
    if (!['day', 'week', 'month', 'year'].includes(period)) {
      return errorResponse('周期参数非法');
    }

    const { start, end, label } = getRange(period, date);
    const where = { ...buildEnterpriseWhere(ctx), recordDate: { gte: start, lte: end } };

    const records = await prisma.financeRecord.findMany({
      where,
      select: { type: true, category: true, amount: true },
    });

    const incomeByCategory = new Map<string, number>();
    const expenseByCategory = new Map<string, number>();
    for (const r of records) {
      const amount = Number(r.amount);
      if (r.type === 'income') {
        incomeByCategory.set(r.category, (incomeByCategory.get(r.category) || 0) + amount);
      } else {
        expenseByCategory.set(r.category, (expenseByCategory.get(r.category) || 0) + amount);
      }
    }

    const salesRevenue = incomeByCategory.get(FINANCE_CATEGORIES.SALES) || 0;
    const otherIncome =
      [...incomeByCategory.entries()]
        .filter(([cat]) => cat !== FINANCE_CATEGORIES.SALES)
        .reduce((s, [, v]) => s + v, 0);
    const costOfGoods = expenseByCategory.get(FINANCE_CATEGORIES.DRUG_PURCHASE) || 0;
    const commission = expenseByCategory.get(FINANCE_CATEGORIES.COMMISSION) || 0;
    const fixedExpenses =
      [...expenseByCategory.entries()]
        .filter(([cat]) => cat !== FINANCE_CATEGORIES.DRUG_PURCHASE && cat !== FINANCE_CATEGORIES.COMMISSION)
        .reduce((s, [, v]) => s + v, 0);

    const chain = calculateProfitChain({ salesRevenue, costOfGoods, commission, fixedExpenses });

    return jsonResponse({
      period,
      label,
      chain: { ...chain, otherIncome: Number(otherIncome.toFixed(2)) },
      incomeByCategory: Object.fromEntries(
        [...incomeByCategory.entries()].map(([k, v]) => [k, Number(v.toFixed(2))])
      ),
      expenseByCategory: Object.fromEntries(
        [...expenseByCategory.entries()].map(([k, v]) => [k, Number(v.toFixed(2))])
      ),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '利润报表生成失败', 500);
  }
}

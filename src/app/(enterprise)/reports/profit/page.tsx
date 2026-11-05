'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import { FINANCE_CATEGORY_LABELS } from '@/lib/constants';

interface ProfitData {
  label: string;
  chain: {
    salesRevenue: number;
    costOfGoods: number;
    grossProfit: number;
    commission: number;
    fixedExpenses: number;
    netProfit: number;
    otherIncome: number;
  };
  incomeByCategory: Record<string, number>;
  expenseByCategory: Record<string, number>;
}

type Period = 'day' | 'week' | 'month' | 'year';

export default function ProfitReportPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<ProfitData | null>(null);

  useEffect(() => {
    api
      .get<ProfitData>(`/api/reports/profit?period=${period}&date=${date}`)
      .then((r) => setData(r.data ?? null))
      .catch(() => undefined);
  }, [period, date]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">利润链报表</h1>

      <div className="flex gap-3 mb-5 items-center">
        {[
          { v: 'day' as Period, l: '日' },
          { v: 'week' as Period, l: '周' },
          { v: 'month' as Period, l: '月' },
          { v: 'year' as Period, l: '年' },
        ].map((o) => (
          <Button
            key={o.v}
            variant={period === o.v ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(o.v)}
          >
            按{o.l}
          </Button>
        ))}
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {data && <span className="text-sm text-gray-500 ml-auto">统计周期:{data.label}</span>}
      </div>

      {data && (
        <>
          {/* 利润链 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>利润链拆解</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-stretch gap-2">
                <ChainBox
                  title="销售收入"
                  value={data.chain.salesRevenue}
                  color="bg-blue-50 text-blue-700 border-blue-200"
                />
                <Arrow symbol="−" />
                <ChainBox
                  title="商品成本(药品采购)"
                  value={data.chain.costOfGoods}
                  color="bg-orange-50 text-orange-700 border-orange-200"
                />
                <Arrow symbol="=" />
                <ChainBox
                  title="毛利润"
                  value={data.chain.grossProfit}
                  color="bg-indigo-50 text-indigo-700 border-indigo-200"
                />
                <Arrow symbol="−" />
                <div className="flex flex-col gap-2 flex-1">
                  <ChainBox
                    small
                    title="员工提成"
                    value={data.chain.commission}
                    color="bg-purple-50 text-purple-700 border-purple-200"
                  />
                  <ChainBox
                    small
                    title="经营/固定支出"
                    value={data.chain.fixedExpenses}
                    color="bg-red-50 text-red-700 border-red-200"
                  />
                </div>
                <Arrow symbol="=" />
                <ChainBox
                  title="净利润"
                  value={data.chain.netProfit}
                  color={
                    data.chain.netProfit >= 0
                      ? 'bg-green-50 text-green-700 border-green-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }
                  highlight
                />
              </div>
              {data.chain.otherIncome > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  注:本期另有其他收入 {formatCurrency(data.chain.otherIncome)}(未计入销售利润链)
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <CategoryCard title="收入构成" data={data.incomeByCategory} />
            <CategoryCard title="支出构成" data={data.expenseByCategory} />
          </div>
        </>
      )}
    </div>
  );
}

function ChainBox({
  title,
  value,
  color,
  small,
  highlight,
}: {
  title: string;
  value: number;
  color: string;
  small?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex-1 rounded-lg border p-4 flex flex-col justify-center ${color} ${
        highlight ? 'ring-2 ring-offset-1 ring-green-300' : ''
      }`}
    >
      <div className={`${small ? 'text-xs' : 'text-sm'} opacity-80`}>{title}</div>
      <div className={`${small ? 'text-lg' : 'text-2xl'} font-bold mt-1`}>{formatCurrency(value)}</div>
    </div>
  );
}

function Arrow({ symbol }: { symbol: string }) {
  return (
    <div className="flex items-center justify-center text-xl font-bold text-gray-400 px-1">
      {symbol}
    </div>
  );
}

function CategoryCard({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="py-8 text-center text-gray-400">本期无数据</div>
        ) : (
          <div className="space-y-2">
            {entries.map(([cat, amount]) => {
              const total = entries.reduce((s, [, v]) => s + v, 0);
              const pct = total > 0 ? Math.round((amount / total) * 100) : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{FINANCE_CATEGORY_LABELS[cat] || cat}</span>
                    <span className="font-medium text-gray-800">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

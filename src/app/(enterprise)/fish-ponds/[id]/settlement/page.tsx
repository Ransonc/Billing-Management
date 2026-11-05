'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';

interface SettlementData {
  pondName: string;
  summary: {
    totalInput: number;
    totalRevenue: number;
    grossProfit: number;
    deathRate: number;
    avgWeight: number | null;
    feedCostPerKg: number | null;
  };
  details: { totalDeaths: number };
}

export default function SettlementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<SettlementData | null>(null);

  useEffect(() => {
    api
      .get<SettlementData>(`/api/fish-ponds/${id}/settlement`)
      .then((res) => setData(res.data ?? null))
      .catch(() => undefined);
  }, [id]);

  if (!data) return <div className="py-20 text-center text-gray-400">结算中...</div>;

  const s = data.summary;
  const profitPositive = s.grossProfit >= 0;

  return (
    <div className="max-w-4xl">
      <Link href={`/fish-ponds/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回鱼塘详情
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">
        周期结算 · {data.pondName}
      </h1>

      {/* 利润大头卡 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-5">
          <div className="text-sm text-gray-500">总投入</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(s.totalInput)}</div>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <div className="text-sm text-gray-500">总产出(出售收入)</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(s.totalRevenue)}</div>
        </div>
        <div className={`rounded-lg border p-5 ${profitPositive ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
          <div className="text-sm text-gray-500">周期毛利润</div>
          <div className={`text-2xl font-bold mt-1 ${profitPositive ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(s.grossProfit)}
          </div>
        </div>
      </div>

      {/* 投入构成 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>投入 / 产出明细</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y">
              <Row label="累计死亡(尾)" value={`${data.details.totalDeaths}`} />
              <Row label="死亡率" value={`${s.deathRate}%`} />
              <Row label="平均出售规格(斤/尾)" value={s.avgWeight != null ? String(s.avgWeight) : '-'} />
              <Row label="每斤鱼饲料成本" value={s.feedCostPerKg != null ? formatCurrency(s.feedCostPerKg) : '-'} />
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-4">
            说明:总投入 = 鱼苗 + 饲料 + 药品 + 其他记账成本;毛利润 = 出售收入 - 总投入。
          </p>
        </CardContent>
      </Card>

      <Link href={`/fish-ponds/${id}/sales`}>
        <Button variant="outline">继续登记出售</Button>
      </Link>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-3 text-gray-500">{label}</td>
      <td className="py-3 text-right font-medium text-gray-800">{value}</td>
    </tr>
  );
}

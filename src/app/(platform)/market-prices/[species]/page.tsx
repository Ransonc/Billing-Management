'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '@/hooks/use-api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MARKET_TREND_RANGES } from '@/lib/constants';
import type { MarketPrice } from '@/types';

// 平台超管 - 单品种价格趋势
export default function MarketPriceSpeciesPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species } = use(params);
  const decoded = decodeURIComponent(species);
  const [days, setDays] = useState<number>(30);
  const [items, setItems] = useState<MarketPrice[]>([]);

  useEffect(() => {
    api
      .get<{ items: MarketPrice[] }>(`/api/market-prices/history?species=${encodeURIComponent(decoded)}&days=${days}`)
      .then((r) => setItems(r.data?.items || []))
      .catch(() => setItems([]));
  }, [decoded, days]);

  const chartData = useMemo(
    () =>
      items.map((p) => ({
        date: formatDate(p.priceDate),
        avg: p.avgPrice != null ? Number(p.avgPrice) : null,
        min: p.minPrice != null ? Number(p.minPrice) : null,
        max: p.maxPrice != null ? Number(p.maxPrice) : null,
      })),
    [items]
  );

  const latest = items[items.length - 1];
  const first = items[0];
  const change =
    latest?.avgPrice != null && first?.avgPrice != null && Number(first.avgPrice) !== 0
      ? Math.round(((Number(latest.avgPrice) - Number(first.avgPrice)) / Number(first.avgPrice)) * 1000) / 10
      : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/market-prices">
          <Button variant="outline" size="sm">
            ‹ 返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">{decoded} 价格走势</h1>
      </div>

      <div className="flex gap-2 mb-5">
        {MARKET_TREND_RANGES.map((d) => (
          <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>
            近{d}天
          </Button>
        ))}
      </div>

      {latest && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">最新均价</div>
              <div className="text-2xl font-bold text-red-500 mt-1">
                {latest.avgPrice != null ? formatCurrency(latest.avgPrice) : '-'}
              </div>
              <div className="text-xs text-gray-400 mt-1">元/斤 · {formatDate(latest.priceDate)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">区间涨跌</div>
              <div className={`text-2xl font-bold mt-1 ${change >= 0 ? 'text-red-500' : 'text-green-600'}`}>
                {change >= 0 ? '+' : ''}
                {change}%
              </div>
              <div className="text-xs text-gray-400 mt-1">近{days}天</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-500">样本数</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{items.length}</div>
              <div className="text-xs text-gray-400 mt-1">条报价记录</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>均价走势与价格区间(元/斤)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-20 text-center text-gray-400">所选周期内暂无报价数据</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="max"
                  stroke="none"
                  fill="#ffcdd2"
                  name="最高价"
                  connectNulls
                />
                <Area
                  type="monotone"
                  dataKey="min"
                  stroke="none"
                  fill="#ffffff"
                  name="最低价"
                  connectNulls
                />
                <Line type="monotone" dataKey="avg" stroke="#e53935" strokeWidth={2} name="均价" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

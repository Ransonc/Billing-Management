'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { useApi, api } from '@/hooks/use-api';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { MarketPrice } from '@/types';

interface Subscription {
  id: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: string;
}
interface SubResp {
  subscription: Subscription | null;
  active: boolean;
}

const PLANS = [
  { key: 'monthly', label: '月度版', months: 1, desc: '适合短期试用' },
  { key: 'quarterly', label: '季度版', months: 3, desc: '覆盖一个养殖周期' },
  { key: 'yearly', label: '年度版', months: 12, desc: '全年行情尽在掌握' },
] as const;

// 企业端 - 批发行情(订阅制,支付流程待接入)
export default function EnterpriseMarketPricesPage() {
  const [items, setItems] = useState<MarketPrice[]>([]);
  const [sub, setSub] = useState<SubResp | null>(null);
  const { call, loading } = useApi<SubResp>();

  function load() {
    api
      .get<{ items: MarketPrice[] }>('/api/market-prices')
      .then((r) => setItems(r.data?.items || []))
      .catch(() => undefined);
    call(() => api.get<SubResp>('/api/market-subscriptions'), { showError: false }).then((r) => {
      if (r) setSub(r);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function subscribe(plan: string) {
    const result = await call(() => api.post<SubResp>('/api/market-subscriptions', { plan }), {
      showSuccess: true,
      successMsg: '订阅成功',
    });
    if (result) setSub(result);
  }

  return (
    <div>
      <PageHeader title="批发行情" description="实时掌握各鱼种批发价格走势,辅助销售定价" />

      {/* 订阅状态 */}
      <Card className="mb-5">
        <CardContent className="p-5">
          {sub?.active ? (
            <div className="flex items-center">
              <span className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mr-3">✅</span>
              <div className="flex-1">
                <div className="font-medium text-gray-800">行情服务已开通</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  有效期至 {formatDate(sub.subscription!.endDate)}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="font-medium text-gray-800 mb-1">开通行情订阅,查看完整报价与走势</div>
              <div className="text-xs text-gray-400 mb-4">支付功能即将上线,开通后立即生效</div>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((p) => (
                  <div key={p.key} className="border rounded-xl p-4 text-center">
                    <div className="font-semibold text-gray-800">{p.label}</div>
                    <div className="text-xs text-gray-400 mt-1 mb-3">{p.desc}</div>
                    <Button size="sm" className="w-full" disabled={loading} onClick={() => subscribe(p.key)}>
                      立即开通
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 最新报价 */}
      <Card>
        <CardHeader>
          <CardTitle>各品种最新报价</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {items.map((p) => (
              <Link
                key={p.id}
                href={`/market-prices/${encodeURIComponent(p.species)}`}
                className="border rounded-xl p-4 hover:border-primary hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-gray-800">{p.species}</div>
                  {p.specification && (
                    <span className="text-xs text-gray-400 border rounded px-1.5 py-0.5">{p.specification}</span>
                  )}
                </div>
                <div className="text-2xl font-bold text-red-500 mt-2">
                  {p.avgPrice != null ? formatCurrency(p.avgPrice) : '-'}
                  <span className="text-xs font-normal text-gray-400 ml-1">元/斤</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {(p.minPrice != null || p.maxPrice != null) &&
                    `${formatCurrency(p.minPrice || 0)} ~ ${formatCurrency(p.maxPrice || 0)} · `}
                  {formatDate(p.priceDate)}
                </div>
              </Link>
            ))}
            {!loading && items.length === 0 && (
              <div className="col-span-3 py-16 text-center text-gray-400">暂无行情数据</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

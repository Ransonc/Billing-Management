'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FISH_SPECIES_OPTIONS } from '@/lib/constants';
import type { MarketPrice } from '@/types';

// 平台超管 - 批发行情维护
export default function PlatformMarketPricesPage() {
  const [items, setItems] = useState<MarketPrice[]>([]);
  const { call, loading } = useApi<{ items: MarketPrice[] }>();
  const [form, setForm] = useState({
    species: '',
    specification: '',
    minPrice: '',
    maxPrice: '',
    avgPrice: '',
    priceDate: new Date().toISOString().slice(0, 10),
    source: '',
  });
  const { call: submitCall, loading: submitting } = useApi<MarketPrice>();

  function load() {
    call(() => api.get<{ items: MarketPrice[] }>('/api/market-prices')).then((r) => {
      if (r) setItems(r.items);
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      species: form.species.trim(),
      specification: form.specification || undefined,
      minPrice: form.minPrice ? Number(form.minPrice) : undefined,
      maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
      avgPrice: form.avgPrice ? Number(form.avgPrice) : undefined,
      priceDate: form.priceDate || undefined,
      source: form.source || undefined,
    };
    const result = await submitCall(() => api.post('/api/market-prices', payload), {
      showSuccess: true,
      successMsg: '行情已发布',
    });
    if (result) {
      setForm((f) => ({ ...f, specification: '', minPrice: '', maxPrice: '', avgPrice: '', source: '' }));
      load();
    }
  }

  const columns = [
    {
      key: 'species',
      header: '品种',
      render: (row: MarketPrice) => (
        <Link href={`/market-prices/${encodeURIComponent(row.species)}`} className="text-primary hover:underline font-medium">
          {row.species}
        </Link>
      ),
    },
    { key: 'specification', header: '规格', render: (row: MarketPrice) => row.specification || '-' },
    {
      key: 'range',
      header: '价格区间(元/斤)',
      render: (row: MarketPrice) =>
        row.minPrice != null || row.maxPrice != null
          ? `${formatCurrency(row.minPrice || 0)} ~ ${formatCurrency(row.maxPrice || 0)}`
          : '-',
    },
    {
      key: 'avgPrice',
      header: '均价',
      render: (row: MarketPrice) => (
        <span className="font-semibold text-red-500">
          {row.avgPrice != null ? formatCurrency(row.avgPrice) : '-'}
        </span>
      ),
    },
    { key: 'priceDate', header: '报价日期', render: (row: MarketPrice) => formatDate(row.priceDate) },
    { key: 'source', header: '来源', render: (row: MarketPrice) => row.source || '-' },
  ];

  return (
    <div>
      <PageHeader title="批发行情" description="维护各鱼种批发市场报价,供企业端订阅查看" />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>发布行情</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label>品种 *</Label>
              <input
                required
                list="fish-species-options"
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={form.species}
                onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
                placeholder="选择或输入品种"
              />
              <datalist id="fish-species-options">
                {FISH_SPECIES_OPTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="specification">规格</Label>
              <Input
                id="specification"
                value={form.specification}
                onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))}
                placeholder="如:1-3斤"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="minPrice">最低价(元/斤)</Label>
              <Input
                id="minPrice"
                type="number"
                step="0.01"
                value={form.minPrice}
                onChange={(e) => setForm((f) => ({ ...f, minPrice: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxPrice">最高价(元/斤)</Label>
              <Input
                id="maxPrice"
                type="number"
                step="0.01"
                value={form.maxPrice}
                onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avgPrice">均价(留空自动算中值)</Label>
              <Input
                id="avgPrice"
                type="number"
                step="0.01"
                value={form.avgPrice}
                onChange={(e) => setForm((f) => ({ ...f, avgPrice: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priceDate">报价日期</Label>
              <Input
                id="priceDate"
                type="date"
                value={form.priceDate}
                onChange={(e) => setForm((f) => ({ ...f, priceDate: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">数据来源</Label>
              <Input
                id="source"
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                placeholder="如:XX批发市场"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? '发布中...' : '发布报价'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>各品种最新报价</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={items} loading={loading} emptyText="暂无行情数据" />
        </CardContent>
      </Card>
    </div>
  );
}

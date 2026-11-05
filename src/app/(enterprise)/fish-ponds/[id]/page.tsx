'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FISH_POND_STATUS_LABELS,
  DEATH_REASON_LABELS,
  WATER_QUALITY_INDICATOR_LABELS,
} from '@/lib/constants';
import type {
  FishStocking,
  DailyDeath,
  FeedRecord,
  DrugRecord,
  SaleRecord,
  WaterQualityRecord,
} from '@/types';

interface PondDetail {
  id: string;
  name: string;
  status: string;
  area?: number | null;
  waterDepth?: number | null;
  fishSpecies?: string | null;
  stockDate?: string | null;
  stockQuantity?: number | null;
  stockWeight?: number | null;
  notes?: string | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
  fishStockings: FishStocking[];
  dailyDeaths: DailyDeath[];
  feedRecords: FeedRecord[];
  drugRecords: DrugRecord[];
  saleRecords: SaleRecord[];
  waterQualities: WaterQualityRecord[];
}

interface TimelineItem {
  date: string;
  icon: string;
  title: string;
  desc: string;
  abnormal?: boolean;
}

export default function FishPondDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { call } = useApi<PondDetail>();
  const [pond, setPond] = useState<PondDetail | null>(null);

  useEffect(() => {
    call(() => api.get<PondDetail>(`/api/fish-ponds/${id}`), { showError: false }).then(setPond);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!pond) {
    return <div className="py-20 text-center text-gray-400">加载中...</div>;
  }

  const totalStock = pond.fishStockings.reduce((s, r) => s + r.quantity, 0);
  const totalStockCost = pond.fishStockings.reduce((s, r) => s + Number(r.totalCost || 0), 0);
  const totalDeaths = pond.dailyDeaths.reduce((s, r) => s + r.quantity, 0);
  const totalFeedCost = pond.feedRecords.reduce((s, r) => s + Number(r.totalCost || 0), 0);
  const totalDrugCost = pond.drugRecords.reduce((s, r) => s + Number(r.cost || 0), 0);
  const totalSaleAmount = pond.saleRecords.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
  const totalSaleQty = pond.saleRecords.reduce((s, r) => s + r.quantity, 0);
  const deathRate = totalStock > 0 ? ((totalDeaths / totalStock) * 100).toFixed(1) : '0.0';

  const actions = [
    { label: '鱼类投放', href: 'stock', icon: '🐣' },
    { label: '每日损耗', href: 'deaths', icon: '⚠️' },
    { label: '饲料记录', href: 'feed', icon: '🌾' },
    { label: '用药记录', href: 'drugs', icon: '💊' },
    { label: '分批出售', href: 'sales', icon: '💰' },
    { label: '水质检测', href: 'water-quality', icon: '💧' },
    { label: '周期结算', href: 'settlement', icon: '📊' },
  ];

  // 汇总时间线
  const timeline: TimelineItem[] = [
    ...pond.fishStockings.map((r) => ({
      date: r.stockDate,
      icon: '🐣',
      title: '鱼类投放',
      desc: `${r.fishSpecies} ${r.quantity} 尾${r.weight ? `/${Number(r.weight)}斤` : ''},成本 ${formatCurrency(r.totalCost)}`,
    })),
    ...pond.dailyDeaths.map((r) => ({
      date: r.deathDate,
      icon: '⚠️',
      title: '损耗记录',
      desc: `死亡 ${r.quantity} 尾(${DEATH_REASON_LABELS[r.reason || ''] || r.reason || '未填原因'})`,
    })),
    ...pond.feedRecords.map((r) => ({
      date: r.feedDate,
      icon: '🌾',
      title: '饲料投喂',
      desc: `${r.brand}${r.model ? ' ' + r.model : ''} ${r.bags} 包,花费 ${formatCurrency(r.totalCost)}`,
    })),
    ...pond.drugRecords.map((r) => ({
      date: r.startDate,
      icon: '💊',
      title: '用药记录',
      desc: `${r.drugName} 用量 ${r.quantity},花费 ${formatCurrency(r.cost)}`,
    })),
    ...pond.saleRecords.map((r) => ({
      date: r.saleDate,
      icon: '💰',
      title: '成鱼出售',
      desc: `${r.fishSpecies} ${r.quantity} 尾/${Number(r.weight)}斤,收入 ${formatCurrency(r.totalAmount)}`,
    })),
    ...pond.waterQualities.map((r) => ({
      date: r.recordDate,
      icon: r.abnormal ? '🔴' : '💧',
      title: `水质检测${r.abnormal ? ' · 异常' : ''}`,
      desc: r.abnormalDetails
        ? r.abnormalDetails
        : (
            [
              ['temperature', r.temperature],
              ['ph', r.ph],
              ['dissolvedOxygen', r.dissolvedOxygen],
              ['ammonia', r.ammonia],
              ['nitrite', r.nitrite],
            ] as [string, number | null | undefined][]
          )
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${WATER_QUALITY_INDICATOR_LABELS[camelToSnake(k)] || k} ${Number(v)}`)
            .join(' / '),
      abnormal: r.abnormal,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link href="/fish-ponds" className="text-sm text-gray-500 hover:text-gray-700">
            ← 返回鱼塘列表
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-2 flex items-center gap-3">
            {pond.name}
            <span
              className={`text-xs px-2 py-0.5 rounded border ${
                pond.status === 'active'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : pond.status === 'sold_out'
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}
            >
              {FISH_POND_STATUS_LABELS[pond.status] || pond.status}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            所属客户: {pond.customer?.name || '自有鱼塘'} · {pond.fishSpecies || '未设置品种'}
          </p>
        </div>
        <Link href={`/fish-ponds/${id}/edit`}>
          <Button variant="outline">编辑档案</Button>
        </Link>
      </div>

      {/* 基础信息 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <InfoCard label="面积 / 水深" value={`${pond.area != null ? Number(pond.area) : '-'} 亩 / ${pond.waterDepth != null ? Number(pond.waterDepth) : '-'} m`} />
        <InfoCard label="累计投放" value={`${totalStock} 尾`} sub={formatCurrency(totalStockCost)} />
        <InfoCard label="累计死亡 / 死亡率" value={`${totalDeaths} 尾 / ${deathRate}%`} danger={totalDeaths > 0} />
        <InfoCard label="累计出售 / 收入" value={`${totalSaleQty} 尾`} sub={formatCurrency(totalSaleAmount)} />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <InfoCard label="饲料总投入" value={formatCurrency(totalFeedCost)} />
        <InfoCard label="药品总投入" value={formatCurrency(totalDrugCost)} />
        <InfoCard
          label="当前毛利"
          value={formatCurrency(totalSaleAmount - totalStockCost - totalFeedCost - totalDrugCost)}
        />
      </div>

      {/* 功能入口 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>养殖操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={`/fish-ponds/${id}/${a.href}`}
                className="flex flex-col items-center gap-2 py-4 rounded-lg border hover:border-primary hover:bg-blue-50/40 transition-colors"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs text-gray-600">{a.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 时间线 */}
      <Card>
        <CardHeader>
          <CardTitle>养殖活动时间线</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无养殖记录,从上方操作开始记录</div>
          ) : (
            <div className="space-y-0">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-4 relative pb-5">
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
                  )}
                  <div className="w-8 h-8 rounded-full bg-gray-50 border flex items-center justify-center text-sm flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className={`text-sm font-medium ${item.abnormal ? 'text-red-600' : 'text-gray-800'}`}>
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                    </div>
                    <p className={`text-sm mt-0.5 ${item.abnormal ? 'text-red-500' : 'text-gray-500'}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  label,
  value,
  sub,
  danger,
}: {
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold mt-1 ${danger ? 'text-red-500' : 'text-gray-800'}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function camelToSnake(key: string): string {
  // dissolvedOxygen -> dissolved_oxygen
  if (key === 'dissolvedOxygen') return 'dissolved_oxygen';
  return key;
}

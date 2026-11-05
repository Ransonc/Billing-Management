'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/hooks/use-api';
import { FISH_POND_STATUS_LABELS } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import type { FishPond } from '@/types';

// 老板移动端 - 鱼塘列表
export default function OwnerFishPondsPage() {
  const [ponds, setPonds] = useState<FishPond[]>([]);

  useEffect(() => {
    api
      .get<{ items: FishPond[] }>('/api/fish-ponds?page=1&pageSize=200')
      .then((r) => setPonds(r.data?.items || []))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">鱼塘管理</div>
        <div className="text-white/80 text-xs mt-1">共 {ponds.length} 口鱼塘</div>
      </div>
      <div className="p-4 space-y-3">
        {ponds.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">暂无鱼塘</div>}
        {ponds.map((p) => (
          <Link key={p.id} href={`/fish-ponds/${p.id}`} className="block bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-800">{p.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {p.fishSpecies || '未设品种'} ·{' '}
                  {p.area ? `${p.area}亩` : '面积未设'}
                </div>
                {p.stockDate && (
                  <div className="text-xs text-gray-500 mt-0.5">投苗 {formatDate(p.stockDate)}</div>
                )}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {FISH_POND_STATUS_LABELS[p.status] || p.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useClientData } from '@/hooks/use-client-data';
import { formatDate } from '@/lib/utils';
import type { DrugRecord } from '@/types';

// 客户移动端 - 全部鱼塘用药记录(时间线)
export default function ClientDrugsPage() {
  const { data, loading } = useClientData();
  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">加载中...</div>;
  if (!data) return <div className="py-20 text-center text-gray-400 text-sm">暂无数据</div>;

  const pondName = new Map(data.ponds.map((p) => [p.id, p.name]));
  const records: DrugRecord[] = data.ponds
    .flatMap((p) => p.drugRecords)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">用药记录</div>
        <div className="text-white/80 text-xs mt-1">共 {records.length} 条</div>
      </div>
      <div className="p-4 space-y-3">
        {records.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl">暂无用药记录</div>
        )}
        {records.map((d) => (
          <div key={d.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-800">{d.drugName}</div>
                <div className="text-xs text-gray-400 mt-1">{pondName.get(d.fishPondId) || '鱼塘'}</div>
              </div>
              <div className="text-sm text-gray-700">
                × {d.quantity}
                {d.cost != null && <div className="text-xs text-gray-400 mt-1 text-right">¥{d.cost}</div>}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {formatDate(d.startDate)}
              {d.endDate ? ` ~ ${formatDate(d.endDate)}` : d.periodDays ? ` · 周期${d.periodDays}天` : ''}
            </div>
            {d.reason && <div className="text-xs text-gray-600 mt-2">用途:{d.reason}</div>}
            {d.notes && <div className="text-xs text-gray-400 mt-1">{d.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

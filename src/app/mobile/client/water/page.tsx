'use client';

import { useClientData } from '@/hooks/use-client-data';
import { formatDateTime } from '@/lib/utils';
import type { WaterQualityRecord } from '@/types';

// 客户移动端 - 全部鱼塘水质检测记录(时间线)
export default function ClientWaterPage() {
  const { data, loading } = useClientData();
  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">加载中...</div>;
  if (!data) return <div className="py-20 text-center text-gray-400 text-sm">暂无数据</div>;

  const pondName = new Map(data.ponds.map((p) => [p.id, p.name]));
  const records: WaterQualityRecord[] = data.ponds
    .flatMap((p) => p.waterQualities)
    .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime());

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">水质检测</div>
        <div className="text-white/80 text-xs mt-1">
          共 {records.length} 条 · 异常 {records.filter((r) => r.abnormal).length} 条
        </div>
      </div>
      <div className="p-4 space-y-3">
        {records.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm bg-white rounded-2xl">暂无检测记录</div>
        )}
        {records.map((w) => (
          <div key={w.id} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium text-gray-800">{pondName.get(w.fishPondId || '') || '鱼塘'}</div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  w.abnormal ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                }`}
              >
                {w.abnormal ? '异常' : '正常'}
              </span>
            </div>
            <div className="text-xs text-gray-400 mt-1">{formatDateTime(w.recordDate)}</div>
            <div className="grid grid-cols-5 gap-1 mt-3 text-center">
              <Metric label="水温" value={w.temperature != null ? `${w.temperature}℃` : '-'} />
              <Metric label="pH" value={w.ph != null ? String(w.ph) : '-'} />
              <Metric label="溶氧" value={w.dissolvedOxygen != null ? String(w.dissolvedOxygen) : '-'} />
              <Metric label="氨氮" value={w.ammonia != null ? String(w.ammonia) : '-'} />
              <Metric label="亚盐" value={w.nitrite != null ? String(w.nitrite) : '-'} />
            </div>
            {w.abnormal && w.abnormalDetails && (
              <div className="mt-3 text-xs text-red-500 bg-red-50 rounded-lg p-2">{w.abnormalDetails}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg py-2">
      <div className="text-xs font-medium text-gray-700">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

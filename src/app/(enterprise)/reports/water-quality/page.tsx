'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';
import { WATER_QUALITY_INDICATOR_LABELS } from '@/lib/constants';
import type { FishPond, WaterQualityRecord } from '@/types';

type IndicatorKey = 'temperature' | 'ph' | 'dissolvedOxygen' | 'ammonia' | 'nitrite';

const INDICATORS: { key: IndicatorKey; color: string }[] = [
  { key: 'temperature', color: '#ff9800' },
  { key: 'ph', color: '#9c27b0' },
  { key: 'dissolvedOxygen', color: '#1e88e5' },
  { key: 'ammonia', color: '#f44336' },
  { key: 'nitrite', color: '#4caf50' },
];

export default function WaterQualityReportPage() {
  const [ponds, setPonds] = useState<FishPond[]>([]);
  const [pondId, setPondId] = useState('');
  const [days, setDays] = useState(30);
  const [records, setRecords] = useState<WaterQualityRecord[]>([]);

  useEffect(() => {
    api
      .get<{ items: FishPond[] }>('/api/fish-ponds?all=1')
      .then((r) => setPonds(r.data?.items || []));
  }, []);

  useEffect(() => {
    if (!pondId) {
      // 切换鱼塘时清空旧数据,避免展示上一口塘的曲线
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecords([]);
      return;
    }
    api
      .get<{ items: WaterQualityRecord[] }>(`/api/water-quality?fishPondId=${pondId}&days=${days}&limit=300`)
      .then((r) => setRecords(r.data?.items || []))
      .catch(() => setRecords([]));
  }, [pondId, days]);

  const chartData = useMemo(() => {
    return [...records]
      .reverse()
      .map((r) => ({
        date: formatDate(r.recordDate),
        temperature: r.temperature != null ? Number(r.temperature) : null,
        ph: r.ph != null ? Number(r.ph) : null,
        dissolvedOxygen: r.dissolvedOxygen != null ? Number(r.dissolvedOxygen) : null,
        ammonia: r.ammonia != null ? Number(r.ammonia) : null,
        nitrite: r.nitrite != null ? Number(r.nitrite) : null,
      }));
  }, [records]);

  const abnormalCount = records.filter((r) => r.abnormal).length;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">水质检测报表</h1>

      <div className="flex gap-3 mb-5 items-center">
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={pondId}
          onChange={(e) => setPondId(e.target.value)}
        >
          <option value="">请选择鱼塘</option>
          {ponds.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {[7, 30, 90].map((d) => (
          <Button key={d} variant={days === d ? 'default' : 'outline'} size="sm" onClick={() => setDays(d)}>
            近 {d} 天
          </Button>
        ))}
        {pondId && (
          <span className="text-sm text-gray-500 ml-auto">
            共 {records.length} 条记录,异常 {abnormalCount} 条
          </span>
        )}
      </div>

      {!pondId ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">请先选择鱼塘查看水质趋势</CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>指标趋势图</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="py-16 text-center text-gray-400">该时间段暂无检测数据</div>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    {INDICATORS.map((ind) => (
                      <Line
                        key={ind.key}
                        type="monotone"
                        dataKey={ind.key}
                        name={WATER_QUALITY_INDICATOR_LABELS[ind.key === 'dissolvedOxygen' ? 'dissolved_oxygen' : ind.key]}
                        stroke={ind.color}
                        connectNulls
                        dot={{ r: 2 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>异常记录</CardTitle>
            </CardHeader>
            <CardContent>
              {records.filter((r) => r.abnormal).length === 0 ? (
                <div className="py-8 text-center text-gray-400">该时间段无异常记录</div>
              ) : (
                <div className="space-y-2">
                  {records
                    .filter((r) => r.abnormal)
                    .map((r) => (
                      <div key={r.id} className="rounded-lg border border-red-200 bg-red-50/40 p-3 text-sm">
                        <span className="font-medium text-gray-800">{formatDate(r.recordDate)}</span>
                        {r.fishPond ? <span className="text-gray-500"> · {r.fishPond.name}</span> : null}
                        <p className="text-red-600 mt-1">{r.abnormalDetails}</p>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

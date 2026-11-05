'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApi, api } from '@/hooks/use-api';
import { formatDateTime } from '@/lib/utils';
import { WATER_QUALITY_INDICATOR_LABELS } from '@/lib/constants';

interface WaterRecord {
  id: string;
  recordDate: string;
  temperature?: number | null;
  ph?: number | null;
  dissolvedOxygen?: number | null;
  ammonia?: number | null;
  nitrite?: number | null;
  abnormal: boolean;
  abnormalDetails?: string | null;
}

const FIELDS = [
  { key: 'temperature', placeholder: '15~32' },
  { key: 'ph', placeholder: '6.5~9.0' },
  { key: 'dissolvedOxygen', placeholder: '4~12' },
  { key: 'ammonia', placeholder: '0~0.6' },
  { key: 'nitrite', placeholder: '0~0.2' },
];

export default function PondWaterQualityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { call, loading } = useApi();
  const [records, setRecords] = useState<WaterRecord[]>([]);
  const [form, setForm] = useState({
    recordDate: new Date().toISOString().slice(0, 10),
    temperature: '',
    ph: '',
    dissolvedOxygen: '',
    ammonia: '',
    nitrite: '',
  });

  const load = useCallback(() => {
    api
      .get<{ items: WaterRecord[] }>(`/api/water-quality?fishPondId=${id}&limit=100`)
      .then((res) => setRecords(res.data?.items || []))
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post('/api/water-quality', { ...form, fishPondId: id }), {
      showSuccess: true,
      successMsg: '水质数据已保存',
    });
    if (result) {
      setForm((f) => ({
        ...f,
        temperature: '',
        ph: '',
        dissolvedOxygen: '',
        ammonia: '',
        nitrite: '',
      }));
      load();
    }
  }

  return (
    <div>
      <Link href={`/fish-ponds/${id}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回鱼塘详情
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">水质检测</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>录入检测数据(系统将按阈值自动判定异常)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="w-52 space-y-1.5">
              <Label htmlFor="recordDate">检测日期 *</Label>
              <Input
                id="recordDate"
                type="date"
                required
                value={form.recordDate}
                onChange={(e) => setForm((f) => ({ ...f, recordDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-5 gap-4">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label htmlFor={field.key}>{WATER_QUALITY_INDICATOR_LABELS[fieldToIndicator(field.key)]}</Label>
                  <Input
                    id={field.key}
                    type="number"
                    step="0.01"
                    placeholder={field.placeholder}
                    value={(form as Record<string, string>)[field.key]}
                    onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '提交中...' : '保存检测数据'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>历史检测记录</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无检测记录</div>
          ) : (
            <div className="space-y-3">
              {records.map((r) => (
                <div
                  key={r.id}
                  className={`rounded-lg border p-4 ${r.abnormal ? 'border-red-200 bg-red-50/40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-800">
                      {formatDateTime(r.recordDate)}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${
                        r.abnormal
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-green-50 text-green-600 border-green-200'
                      }`}
                    >
                      {r.abnormal ? '异常' : '正常'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    {FIELDS.map((field) => {
                      const v = (r as unknown as Record<string, unknown>)[field.key];
                      return (
                        v != null && (
                          <span key={field.key}>
                            {WATER_QUALITY_INDICATOR_LABELS[fieldToIndicator(field.key)]}:{' '}
                            <b className="text-gray-800">{Number(v)}</b>
                          </span>
                        )
                      );
                    })}
                  </div>
                  {r.abnormalDetails && (
                    <p className="text-xs text-red-500 mt-2">⚠ {r.abnormalDetails}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function fieldToIndicator(key: string): string {
  return key === 'dissolvedOxygen' ? 'dissolved_oxygen' : key;
}

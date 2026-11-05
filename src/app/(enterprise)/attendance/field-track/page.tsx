'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi, api } from '@/hooks/use-api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatDateTime } from '@/lib/utils';

interface FieldTrack {
  id: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  status: string;
  userName?: string;
  _count?: { fieldTrackPoints: number };
}

export default function FieldTrackPage() {
  const { call, loading } = useApi();
  const { locate, locating, location } = useGeolocation();
  const [activeTrack, setActiveTrack] = useState<FieldTrack | null>(null);
  const [tracks, setTracks] = useState<FieldTrack[]>([]);
  const [pointCount, setPointCount] = useState(0);

  const load = useCallback(() => {
    api
      .get<{ activeTrack: FieldTrack | null; items: FieldTrack[] }>('/api/field-tracks')
      .then((r) => {
        if (r.data) {
          const d = r.data;
          setActiveTrack(d.activeTrack);
          setTracks(d.items);
          const active = d.items.find((t) => t.id === d.activeTrack?.id);
          setPointCount(active?._count?.fieldTrackPoints || 0);
        }
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTrack() {
    const action = activeTrack ? 'end' : 'start';
    const result = await call(() => api.post('/api/field-tracks', { action }), {
      showSuccess: true,
      successMsg: action === 'start' ? '外勤已开始' : '外勤已结束',
    });
    if (result) {
      if (action === 'start') setPointCount(0);
      load();
    }
  }

  async function reportPoint() {
    if (!activeTrack) return;
    const loc = await locate();
    if (!loc) return;
    const result = await call(
      () =>
        api.post('/api/field-track-points', {
          fieldTrackId: activeTrack.id,
          lat: loc.lat,
          lng: loc.lng,
          accuracy: loc.accuracy,
        }),
      { showSuccess: true, successMsg: '轨迹点已上报' }
    );
    if (result) setPointCount((c) => c + 1);
  }

  return (
    <div>
      <Link href="/attendance" className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回考勤
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">外勤轨迹</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{activeTrack ? '外勤进行中' : '开始外勤'}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeTrack ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                开始时间: <b>{formatDateTime(activeTrack.startTime)}</b>
                <span className="ml-4">已上报轨迹点: <b className="text-primary">{pointCount}</b> 个</span>
              </div>
              {location && (
                <p className="text-xs text-gray-400">
                  当前坐标: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={reportPoint} disabled={loading || locating}>
                  {locating ? '定位中...' : '📍 上报当前位置'}
                </Button>
                <Button variant="destructive" onClick={toggleTrack} disabled={loading}>
                  结束外勤
                </Button>
              </div>
              <p className="text-xs text-gray-400">提示:移动过程中可多次点击「上报当前位置」形成轨迹</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-4">开始外勤后,系统将记录工作时长,并可采集 GPS 运动轨迹。</p>
              <Button onClick={toggleTrack} disabled={loading}>
                开始外勤
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>外勤历史</CardTitle>
        </CardHeader>
        <CardContent>
          {tracks.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无外勤记录</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">员工</th>
                    <th className="text-left font-medium px-4 py-2.5">开始时间</th>
                    <th className="text-left font-medium px-4 py-2.5">结束时间</th>
                    <th className="text-left font-medium px-4 py-2.5">时长(分)</th>
                    <th className="text-left font-medium px-4 py-2.5">轨迹点</th>
                    <th className="text-left font-medium px-4 py-2.5">状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tracks.map((t) => (
                    <tr key={t.id}>
                      <td className="px-4 py-2.5">{t.userName}</td>
                      <td className="px-4 py-2.5">{formatDateTime(t.startTime)}</td>
                      <td className="px-4 py-2.5">{t.endTime ? formatDateTime(t.endTime) : '-'}</td>
                      <td className="px-4 py-2.5">{t.duration || '-'}</td>
                      <td className="px-4 py-2.5">{t._count?.fieldTrackPoints ?? 0}</td>
                      <td className="px-4 py-2.5">
                        {t.status === 'active' ? (
                          <span className="text-xs px-2 py-0.5 rounded border bg-green-50 text-green-600 border-green-200">
                            进行中
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">已结束</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

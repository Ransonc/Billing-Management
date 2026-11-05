'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi, api } from '@/hooks/use-api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';

interface AttendanceRecord {
  id: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInAddr?: string | null;
  checkOutAddr?: string | null;
  status: string;
  date: string;
  userName?: string;
}

const STATUS_TEXT: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  early: '早退',
  missing: '缺卡',
};

export default function AttendancePage() {
  const { call, loading } = useApi();
  const { location, locating, error: geoError, locate } = useGeolocation();
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);

  const load = useCallback(() => {
    api
      .get<{ items: AttendanceRecord[] }>('/api/attendance?today=1')
      .then((r) => setTodayRecords(r.data?.items || []));
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    api
      .get<{ items: AttendanceRecord[] }>(`/api/attendance?month=${month}`)
      .then((r) => setMonthRecords(r.data?.items || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mine = todayRecords[0];

  async function punch(action: 'checkin' | 'checkout') {
    let loc = location;
    if (!loc) loc = await locate();
    await call(
      () =>
        api.post('/api/attendance', {
          action,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
          addr: loc ? `GPS:${loc.lat.toFixed(5)},${loc.lng.toFixed(5)}` : null,
        }),
      { showSuccess: true, successMsg: action === 'checkin' ? '上班打卡成功' : '下班打卡成功' }
    );
    load();
  }

  return (
    <div>
      <PageHeader
        title="考勤打卡"
        description=""
        actions={
          <div className="flex gap-2">
            <Link href="/attendance/field-track">
              <Button variant="outline">外勤轨迹</Button>
            </Link>
            <Link href="/attendance/visits">
              <Button variant="outline">客户拜访</Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>今日打卡</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={loading || Boolean(mine?.checkInTime)}
                onClick={() => punch('checkin')}
              >
                {locating ? '定位中...' : '上班打卡'}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                disabled={loading || !mine?.checkInTime || Boolean(mine?.checkOutTime)}
                onClick={() => punch('checkout')}
              >
                下班打卡
              </Button>
            </div>
            {geoError && <p className="text-xs text-orange-500">{geoError}</p>}
            {mine && (
              <div className="text-sm space-y-2 border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">上班时间</span>
                  <span className="text-gray-800">
                    {mine.checkInTime ? formatDateTime(mine.checkInTime) : '未打卡'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">下班时间</span>
                  <span className="text-gray-800">
                    {mine.checkOutTime ? formatDateTime(mine.checkOutTime) : '未打卡'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">考勤状态</span>
                  <span
                    className={
                      mine.status === 'normal'
                        ? 'text-green-600 font-medium'
                        : 'text-orange-600 font-medium'
                    }
                  >
                    {STATUS_TEXT[mine.status] || mine.status}
                  </span>
                </div>
                {mine.checkInAddr && (
                  <p className="text-xs text-gray-400">打卡位置: {mine.checkInAddr}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>本月考勤记录</CardTitle>
          </CardHeader>
          <CardContent>
            {monthRecords.length === 0 ? (
              <div className="py-10 text-center text-gray-400">本月暂无打卡记录</div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left font-medium px-4 py-2.5">日期</th>
                      <th className="text-left font-medium px-4 py-2.5">员工</th>
                      <th className="text-left font-medium px-4 py-2.5">上班</th>
                      <th className="text-left font-medium px-4 py-2.5">下班</th>
                      <th className="text-left font-medium px-4 py-2.5">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {monthRecords.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5">{r.date.slice(0, 10)}</td>
                        <td className="px-4 py-2.5">{r.userName || '-'}</td>
                        <td className="px-4 py-2.5">{r.checkInTime ? formatDateTime(r.checkInTime) : '-'}</td>
                        <td className="px-4 py-2.5">{r.checkOutTime ? formatDateTime(r.checkOutTime) : '-'}</td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${
                              r.status === 'normal'
                                ? 'bg-green-50 text-green-600 border-green-200'
                                : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}
                          >
                            {STATUS_TEXT[r.status] || r.status}
                          </span>
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
    </div>
  );
}

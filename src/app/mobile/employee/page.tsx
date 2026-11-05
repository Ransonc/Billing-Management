'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api } from '@/hooks/use-api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatDateTime } from '@/lib/utils';
import type { Attendance, FieldTrack, CustomerVisit } from '@/types';

interface AttendanceResp {
  items: Attendance[];
}
interface TracksResp {
  activeTrack: FieldTrack | null;
}
interface VisitsResp {
  items: CustomerVisit[];
}

// 员工移动端工作台:打卡、外勤、今日拜访、快捷业务
export default function EmployeeMobileHome() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [activeTrack, setActiveTrack] = useState<FieldTrack | null>(null);
  const [visits, setVisits] = useState<CustomerVisit[]>([]);
  const [busy, setBusy] = useState(false);
  const { locate, locating } = useGeolocation();

  const load = useCallback(() => {
    api.get<AttendanceResp>('/api/attendance?today=1').then((r) => setTodayAttendance(r.data?.items[0] || null)).catch(() => undefined);
    api.get<TracksResp>('/api/field-tracks').then((r) => setActiveTrack(r.data?.activeTrack ?? null)).catch(() => undefined);
    api.get<VisitsResp>('/api/visits?today=1').then((r) => setVisits(r.data?.items || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckin(action: 'checkin' | 'checkout') {
    setBusy(true);
    try {
      const loc = await locate();
      const result = await api.post<{ record: Attendance }>('/api/attendance', {
        action,
        lat: loc?.lat,
        lng: loc?.lng,
      });
      if (result.data) {
        setTodayAttendance(result.data.record);
      }
    } catch {
      // useApi 提示已在 api 拦截器处理
    } finally {
      setBusy(false);
    }
  }

  async function handleTrack(action: 'start' | 'end') {
    setBusy(true);
    try {
      await api.post('/api/field-tracks', { action });
      load();
    } catch {
      // 已统一提示
    } finally {
      setBusy(false);
    }
  }

  const checkedIn = !!todayAttendance?.checkInTime;
  const checkedOut = !!todayAttendance?.checkOutTime;

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-12 text-white">
        <div className="text-lg font-bold">员工工作台</div>
        <div className="text-white/80 text-xs mt-1">
          {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="text-xs text-white/80">上班打卡</div>
            <div className="text-base font-bold mt-1">
              {checkedIn ? formatDateTime(todayAttendance!.checkInTime).slice(11) : '未打卡'}
            </div>
            <Button
              size="sm"
              disabled={busy || locating || checkedIn}
              className="mt-2 w-full bg-white text-primary hover:bg-white/90 h-8 text-xs"
              onClick={() => handleCheckin('checkin')}
            >
              {checkedIn ? '已打卡' : '上班打卡'}
            </Button>
          </div>
          <div className="bg-white/15 rounded-2xl p-4">
            <div className="text-xs text-white/80">下班打卡</div>
            <div className="text-base font-bold mt-1">
              {checkedOut ? formatDateTime(todayAttendance!.checkOutTime!).slice(11) : '未打卡'}
            </div>
            <Button
              size="sm"
              disabled={busy || locating || !checkedIn || checkedOut}
              variant="outline"
              className="mt-2 w-full h-8 text-xs border-white text-white hover:bg-white/10 hover:text-white bg-transparent"
              onClick={() => handleCheckin('checkout')}
            >
              下班打卡
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center">
          <div className="flex-1">
            <div className="font-semibold text-gray-800">外勤轨迹</div>
            <div className="text-xs text-gray-500 mt-1">
              {activeTrack
                ? `外勤中 · 开始于 ${formatDateTime(activeTrack.startTime).slice(11)}`
                : '当前无进行中的外勤'}
            </div>
          </div>
          {activeTrack ? (
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => handleTrack('end')}>
              结束外勤
            </Button>
          ) : (
            <Button size="sm" disabled={busy} onClick={() => handleTrack('start')}>
              开始外勤
            </Button>
          )}
        </div>
      </div>

      {/* 快捷业务 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-gray-800 mb-3">快捷操作</div>
          <div className="grid grid-cols-4 gap-y-4">
            <Link href="/sales/new" className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">🧾</span>
              <span className="text-xs text-gray-600">销售录入</span>
            </Link>
            <Link href="/mobile/employee/visits" className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl">📍</span>
              <span className="text-xs text-gray-600">客户拜访</span>
            </Link>
            <Link href="/attendance" className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl">🗓</span>
              <span className="text-xs text-gray-600">考勤记录</span>
            </Link>
            <Link href="/attendance/field-track" className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl">🗺</span>
              <span className="text-xs text-gray-600">轨迹记录</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 今日拜访 */}
      <div className="px-4 mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold text-gray-800">今日拜访</div>
            <Link href="/mobile/employee/visits" className="text-xs text-primary">
              全部 ›
            </Link>
          </div>
          {visits.length === 0 && <div className="py-6 text-center text-gray-400 text-sm">今天还没有拜访记录</div>}
          <div className="space-y-2">
            {visits.slice(0, 5).map((v) => (
              <div key={v.id} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">
                    {v.customer?.name || '客户'} · {v.purpose}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(v.startTime)}</div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    v.endTime ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
                  }`}
                >
                  {v.endTime ? '已结束' : '进行中'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

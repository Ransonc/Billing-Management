'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@/types';

// 老板移动端经营驾驶舱
export default function OwnerMobileHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api
      .get<DashboardStats>('/api/dashboard/stats')
      .then((r) => setStats(r.data ?? null))
      .catch(() => undefined);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';
  const today = new Date();
  const dateText = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div>
      {/* 渐变头部 */}
      <div className="gradient-header px-5 pt-10 pb-16 text-white rounded-b-3xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-white/80 text-sm">
              {greeting},老板 · {dateText}
            </div>
            <div className="text-xl font-bold mt-1">今日经营概况</div>
          </div>
          <Link href="/mobile/owner/profile" className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg">
            👤
          </Link>
        </div>
        <div className="mt-6">
          <div className="text-white/80 text-xs">今日销售额(元)</div>
          <div className="text-4xl font-bold mt-1">{stats ? formatCurrency(stats.todaySales) : '—'}</div>
          <div className="text-white/70 text-xs mt-2">
            本月销售 {stats ? formatCurrency(stats.monthSales) : '—'} · 环比{' '}
            {stats ? `${stats.salesTrend.change >= 0 ? '+' : ''}${stats.salesTrend.change}%` : '—'}
          </div>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="px-4 -mt-10">
        <div className="bg-white rounded-2xl shadow-sm grid grid-cols-2 divide-x divide-gray-100">
          <Metric label="本月毛利润" value={stats ? formatCurrency(stats.monthGrossProfit) : '—'} color="text-blue-600" />
          <Metric label="本月净利润" value={stats ? formatCurrency(stats.monthNetProfit) : '—'} color="text-green-600" />
          <Metric label="待收欠款" value={stats ? formatCurrency(stats.pendingDebt) : '—'} color="text-red-500" />
          <Metric label="库存预警" value={stats ? `${stats.lowStockDrugs} 种` : '—'} color="text-orange-500" />
        </div>
      </div>

      {/* 待办提醒 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-gray-800 mb-2">经营提醒</div>
          <Link href="/mobile/owner/reports" className="flex items-center py-2 border-b border-gray-50">
            <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mr-3">💰</span>
            <span className="flex-1 text-sm text-gray-700">{stats?.debtCustomerCount || 0} 位客户有待回款</span>
            <span className="text-red-500 font-bold text-sm">{stats ? formatCurrency(stats.pendingDebt) : '—'}</span>
          </Link>
          <Link href="/mobile/owner/fish-ponds" className="flex items-center py-2 border-b border-gray-50">
            <span className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center mr-3">📊</span>
            <span className="flex-1 text-sm text-gray-700">{stats?.abnormalCustomers || 0} 位客户消费异常</span>
            <span className="text-gray-400 text-sm">›</span>
          </Link>
          <Link href="/mobile/owner/reports" className="flex items-center py-2">
            <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3">💧</span>
            <span className="flex-1 text-sm text-gray-700">今日水质异常 {stats?.abnormalWaterQuality || 0} 起</span>
            <span className="text-gray-400 text-sm">›</span>
          </Link>
        </div>
      </div>

      {/* 员工动态 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-gray-800 mb-3">员工动态</div>
          <div className="grid grid-cols-3 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800">
                {stats ? `${stats.employeeCheckedIn}/${stats.employeeTotal}` : '—'}
              </div>
              <div className="text-xs text-gray-500 mt-1">今日打卡</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">{stats?.fieldWorkers ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">外勤中</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-800">{stats?.todayVisits ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">今日拜访</div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="px-4 mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-gray-800 mb-3">常用功能</div>
          <div className="grid grid-cols-4 gap-y-4">
            {[
              { icon: '👥', label: '客户', href: '/customers' },
              { icon: '🐟', label: '鱼塘', href: '/fish-ponds' },
              { icon: '💊', label: '药品', href: '/drugs' },
              { icon: '🛒', label: '采购', href: '/drugs/purchase' },
              { icon: '🧾', label: '销售', href: '/sales/new' },
              { icon: '💳', label: '欠款', href: '/debts' },
              { icon: '📝', label: '记账', href: '/finance/new' },
              { icon: '📈', label: '行情', href: '/market' },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1.5">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">
                  {item.icon}
                </span>
                <span className="text-xs text-gray-600">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-4 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

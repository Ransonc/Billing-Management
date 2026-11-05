'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useApi, api } from '@/hooks/use-api';
import type { DashboardStats } from '@/types';

// 企业老板经营驾驶舱 Web 版
// 数据来源 /api/dashboard/stats;移动端版本见 src/app/(mobile)/owner/page.tsx
export default function EnterpriseDashboard() {
  const { call } = useApi<DashboardStats>();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    call(() => api.get<DashboardStats>('/api/dashboard/stats'), { showError: false }).then(setStats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!stats) {
    return <div className="py-20 text-center text-gray-400">经营数据加载中...</div>;
  }

  const salesChange = stats.salesTrend?.change ?? 0;
  const salesTrendText = `${salesChange >= 0 ? '↑' : '↓'} ${Math.abs(salesChange)}% 环比上月`;

  return (
    <div className="space-y-5">
      {/* 经营概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <HighlightCard
          label="今日销售额"
          value={formatCurrency(stats.todaySales)}
          trend="今日实时"
          trendUp
        />
        <DataCard label="本月销售额" value={formatCurrency(stats.monthSales)} trend={salesTrendText} trendUp={salesChange >= 0} />
        <DataCard label="本月毛利润" value={formatCurrency(stats.monthGrossProfit)} trend="财务口径" trendUp={stats.monthGrossProfit >= 0} />
        <DataCard label="本月净利润" value={formatCurrency(stats.monthNetProfit)} trend="扣减提成与支出" trendUp={stats.monthNetProfit >= 0} />
      </div>

      {/* 两栏布局 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 左:经营提醒 */}
        <div className="col-span-2 bg-white rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">经营提醒</h3>
            <Link href="/debts" className="text-sm text-primary cursor-pointer hover:underline">
              查看全部 ›
            </Link>
          </div>
          <div className="space-y-0">
            <Link href="/debts">
              <AlertItem icon="💰" iconColor="red" title="待收欠款" desc={`${stats.debtCustomerCount} 位客户待回款`} value={formatCurrency(stats.pendingDebt)} valueColor="red" />
            </Link>
            <Link href="/drugs">
              <AlertItem icon="📦" iconColor="orange" title="库存预警" desc={`${stats.lowStockDrugs} 种药品低于安全库存`} value={String(stats.lowStockDrugs)} valueColor="orange" />
            </Link>
            <Link href="/customers">
              <AlertItem icon="📊" iconColor="yellow" title="客户消费异常" desc={`${stats.abnormalCustomers} 位客户消费波动超阈值`} value={String(stats.abnormalCustomers)} valueColor="yellow" />
            </Link>
            <Link href="/reports/water-quality">
              <AlertItem icon="💧" iconColor="blue" title="今日水质异常" desc="点击查看水质检测报表" value={String(stats.abnormalWaterQuality)} valueColor="blue" />
            </Link>
          </div>
        </div>

        {/* 右:员工概览 */}
        <div className="bg-white rounded-lg p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">员工工作概览</h3>
            <Link href="/attendance" className="text-sm text-primary cursor-pointer hover:underline">
              详情 ›
            </Link>
          </div>
          <div className="grid grid-cols-3 text-center py-4">
            <div>
              <div className="text-xl font-bold text-gray-800">
                {stats.employeeCheckedIn}/{stats.employeeTotal}
              </div>
              <div className="text-xs text-gray-500 mt-1">今日已打卡</div>
            </div>
            <div className="border-l border-gray-100 border-r">
              <div className="text-xl font-bold text-gray-800">{stats.fieldWorkers}</div>
              <div className="text-xs text-gray-500 mt-1">外勤中</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-800">{stats.todayVisits}</div>
              <div className="text-xs text-gray-500 mt-1">今日拜访</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link href="/employees/commission" className="block text-center py-3 rounded-lg bg-blue-50 text-primary text-sm font-medium hover:bg-blue-100">
              员工提成
            </Link>
            <Link href="/reports/profit" className="block text-center py-3 rounded-lg bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100">
              利润报表
            </Link>
          </div>
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-lg p-5">
        <h3 className="font-semibold text-gray-800 mb-4">常用功能</h3>
        <div className="grid grid-cols-8 gap-3">
          {[
            { icon: '👥', label: '客户管理', href: '/customers' },
            { icon: '🐟', label: '鱼塘管理', href: '/fish-ponds' },
            { icon: '💊', label: '药品库存', href: '/drugs' },
            { icon: '🛒', label: '药品采购', href: '/drugs/purchase' },
            { icon: '🧾', label: '药品销售', href: '/sales/new' },
            { icon: '💳', label: '欠款回款', href: '/debts' },
            { icon: '📝', label: '记一笔账', href: '/finance/new' },
            { icon: '📈', label: '批发行情', href: '/market' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 py-4 rounded-lg border hover:border-primary hover:bg-blue-50/40 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs text-gray-600">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function HighlightCard({ label, value, trend, trendUp }: { label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <div className="gradient-header rounded-lg p-5 text-white">
      <div className="text-sm text-white/85 mb-2">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-xs mt-2 ${trendUp ? 'text-green-200' : 'text-red-200'}`}>{trend}</div>
    </div>
  );
}

function DataCard({ label, value, trend, trendUp }: { label: string; value: string; trend: string; trendUp: boolean }) {
  return (
    <div className="bg-white rounded-lg p-5 card-shadow-sm">
      <div className="text-sm text-gray-500 mb-2">{label}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className={`text-xs mt-2 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>{trend}</div>
    </div>
  );
}

function AlertItem({
  icon,
  iconColor,
  title,
  desc,
  value,
  valueColor,
}: {
  icon: string;
  iconColor: 'red' | 'orange' | 'yellow' | 'blue';
  title: string;
  desc: string;
  value: string;
  valueColor: string;
}) {
  const bgMap = {
    red: 'bg-red-50 text-red-500',
    orange: 'bg-orange-50 text-orange-500',
    yellow: 'bg-yellow-50 text-yellow-500',
    blue: 'bg-blue-50 text-blue-500',
  };
  const valueColorMap = {
    red: 'text-red-500',
    orange: 'text-orange-500',
    yellow: 'text-yellow-600',
    blue: 'text-blue-500',
  };
  return (
    <div className="flex items-center py-3 border-b last:border-0 border-gray-100 hover:bg-gray-50/50 px-2 -mx-2 rounded">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-base mr-3 ${bgMap[iconColor]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-800 font-medium">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <div className={`text-lg font-bold ${valueColorMap[valueColor as keyof typeof valueColorMap]}`}>
        {value}
      </div>
    </div>
  );
}

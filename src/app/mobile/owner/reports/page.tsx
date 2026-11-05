'use client';

import Link from 'next/link';

// 老板移动端 - 报表入口聚合页
export default function OwnerReportsPage() {
  const items = [
    { icon: '💰', label: '利润链报表', desc: '收入 → 成本 → 净利润', href: '/reports/profit', color: 'bg-green-50' },
    { icon: '💧', label: '水质检测报表', desc: '指标趋势与异常记录', href: '/reports/water-quality', color: 'bg-blue-50' },
    { icon: '🧾', label: '财务收支', desc: '日常收入与支出', href: '/finance', color: 'bg-purple-50' },
    { icon: '🏷', label: '员工提成', desc: '按月生成与发放', href: '/employees/commission', color: 'bg-orange-50' },
    { icon: '💳', label: '欠款回款', desc: '客户赊销与还款', href: '/debts', color: 'bg-red-50' },
    { icon: '📈', label: '批发行情', desc: '鱼种价格走势', href: '/market', color: 'bg-teal-50' },
  ];

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">经营报表</div>
      </div>
      <div className="p-4 space-y-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center bg-white rounded-2xl shadow-sm p-4"
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl mr-3 ${item.color}`}>
              {item.icon}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-800">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </div>
            <span className="text-gray-300">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

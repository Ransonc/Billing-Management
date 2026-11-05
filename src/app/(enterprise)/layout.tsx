import Link from 'next/link';

// 企业内部 Web 布局 (老板 + 员工)
// 左侧企业模块导航

const ENTERPRISE_MENU = [
  { group: '经营', items: [
    { icon: '📊', label: '经营驾驶舱', href: '/dashboard' },
    { icon: '💰', label: '财务管理', href: '/finance' },
    { icon: '📈', label: '利润链报表', href: '/reports/profit' },
    { icon: '💧', label: '水质检测报表', href: '/reports/water-quality' },
  ]},
  { group: '客户与鱼塘', items: [
    { icon: '👥', label: '客户管理', href: '/customers' },
    { icon: '🐟', label: '鱼塘管理', href: '/fish-ponds' },
  ]},
  { group: '药品与销售', items: [
    { icon: '💊', label: '药品库存', href: '/drugs' },
    { icon: '🛒', label: '药品销售', href: '/sales' },
    { icon: '💳', label: '欠款回款', href: '/debts' },
  ]},
  { group: '员工', items: [
    { icon: '🏷', label: '员工提成', href: '/employees/commission' },
    { icon: '📍', label: '考勤外勤', href: '/attendance' },
  ]},
  { group: '更多', items: [
    { icon: '📊', label: '批发行情', href: '/market' },
    { icon: '📥', label: '数据导入', href: '/import' },
  ]},
];

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-56 bg-[#001529] text-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-sm">
            🐟
          </div>
          <span className="font-semibold text-sm">渔智云 · 企业版</span>
        </div>
        <nav className="flex-1 py-3 overflow-auto">
          {ENTERPRISE_MENU.map((group) => (
            <div key={group.group} className="mb-3">
              <div className="px-5 py-2 text-xs text-white/40 uppercase tracking-wider">
                {group.group}
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white flex items-center justify-between px-5 border-b">
          <div className="flex items-center gap-4">
            <div className="text-base font-medium text-gray-800">顺德水产养殖有限公司</div>
            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">
              已激活
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>👤 张老板</span>
            <span className="text-gray-300">|</span>
            <a href="/login" className="text-gray-500 hover:text-gray-700">退出</a>
          </div>
        </header>

        <main className="flex-1 p-5 overflow-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}

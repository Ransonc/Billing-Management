import Link from 'next/link';

// 超级管理员 Web 后台布局
// 参考设计稿:深蓝侧边栏 + 顶部栏 + 主内容区
const PLATFORM_MENU = [
  { icon: '📊', label: '平台概览', href: '/overview' },
  { icon: '🏢', label: '企业管理', href: '/enterprises', badge: 128 },
  { icon: '👥', label: '用户管理', href: '/users' },
  { icon: '📈', label: '行情数据', href: '/market-prices' },
  { icon: '⚙️', label: '系统配置', href: '/system-config' },
  { icon: '🔐', label: '权限管理', href: '/system-config/permissions' },
  { icon: '📋', label: '基础数据', href: '/system-config/basic-data' },
  { icon: '📝', label: '操作日志', href: '/audit-logs' },
  { icon: '🔔', label: '消息通知', href: '/system-config/notifications' },
];

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* 侧边栏 */}
      <aside className="w-60 bg-[#001529] text-white flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-sm">
            🐟
          </div>
          <span className="font-semibold text-base">渔智云管理平台</span>
        </div>
        <nav className="flex-1 py-4">
          {PLATFORM_MENU.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-6 py-3 text-sm text-white/65 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 主内容 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <header className="h-16 bg-white flex items-center justify-between px-6 shadow-sm">
          <div className="text-sm text-gray-500">
            首页 / <span className="text-gray-700 font-medium">平台概览</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-60 h-8 bg-gray-100 rounded-full flex items-center px-4 text-sm text-gray-400">
              🔍 搜索...
            </div>
            <div className="relative text-lg cursor-pointer text-gray-600">
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                8
              </span>
            </div>
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                管
              </div>
              <span className="text-sm text-gray-700">超级管理员</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

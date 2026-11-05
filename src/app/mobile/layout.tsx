// 移动端布局 - 响应式设计(375px)
// 参考老板移动端驾驶舱设计稿:顶部渐变 + 内容区 + 底部 5 栏导航
// 底部导航按登录角色切换:老板 / 员工 / 客户

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthContext } from '@/server/permissions';
import { ROLES } from '@/lib/constants';

const NAV_MAP = {
  owner: [
    { icon: '🏠', label: '首页', href: '/mobile/owner' },
    { icon: '👥', label: '客户', href: '/mobile/owner/customers' },
    { icon: '🐟', label: '鱼塘', href: '/mobile/owner/fish-ponds' },
    { icon: '📈', label: '报表', href: '/mobile/owner/reports' },
    { icon: '👤', label: '我的', href: '/mobile/owner/profile' },
  ],
  employee: [
    { icon: '🏠', label: '首页', href: '/mobile/employee' },
    { icon: '👥', label: '客户', href: '/mobile/employee/customers' },
    { icon: '🧾', label: '销售', href: '/sales/new' },
    { icon: '📍', label: '拜访', href: '/mobile/employee/visits' },
    { icon: '👤', label: '我的', href: '/mobile/employee/profile' },
  ],
  client: [
    { icon: '🏠', label: '首页', href: '/mobile/client' },
    { icon: '🐟', label: '鱼塘', href: '/mobile/client/fish-ponds' },
    { icon: '💧', label: '检测', href: '/mobile/client/water' },
    { icon: '💊', label: '用药', href: '/mobile/client/drugs' },
    { icon: '👤', label: '我的', href: '/mobile/client/profile' },
  ],
} as const;

export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  // 移动端全部页面均需登录,未登录跳转登录页
  if (!ctx) redirect('/login');

  const role =
    ctx?.role === ROLES.EMPLOYEE ? 'employee' : ctx?.role === ROLES.CUSTOMER ? 'client' : 'owner';
  const nav = NAV_MAP[role];

  return (
    <div className="min-h-screen bg-gray-50 max-w-[480px] mx-auto relative pb-20 shadow-sm">
      <div className="min-h-screen">{children}</div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[70px] bg-white border-t border-gray-200 flex items-center justify-around pb-2 z-50">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 text-gray-500 text-[11px] hover:text-primary transition-colors"
          >
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

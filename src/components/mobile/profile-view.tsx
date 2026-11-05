'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { api } from '@/hooks/use-api';

interface AuthUser {
  id: string;
  email: string;
  metadata: { name?: string; display_name?: string };
}

// 移动端「我的」共享页(老板/员工/客户通用)
export function ProfileView({ roleLabel, homeHref }: { roleLabel: string; homeHref: string }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    api
      .get<{ user: AuthUser | null }>('/api/auth/user')
      .then((r) => setUser(r.data?.user ?? null))
      .catch(() => undefined);
  }, []);

  async function handleLogout() {
    if (!confirm('确定退出登录吗?')) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  }

  const displayName = user?.metadata?.name || user?.metadata?.display_name || user?.email || '用户';

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-14 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
            👤
          </div>
          <div>
            <div className="text-xl font-bold">{displayName}</div>
            <div className="text-white/80 text-xs mt-1">
              {user?.email} · {roleLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          <Link href={homeHref} className="flex items-center px-4 py-4">
            <span className="mr-3">🏠</span>
            <span className="flex-1 text-sm text-gray-700">返回首页</span>
            <span className="text-gray-300">›</span>
          </Link>
          <Link href="/dashboard" className="flex items-center px-4 py-4">
            <span className="mr-3">💻</span>
            <span className="flex-1 text-sm text-gray-700">切换到电脑端</span>
            <span className="text-gray-300">›</span>
          </Link>
        </div>

        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl text-red-500 border-red-200 bg-white"
          disabled={loggingOut}
          onClick={handleLogout}
        >
          {loggingOut ? '退出中...' : '退出登录'}
        </Button>
      </div>
    </div>
  );
}

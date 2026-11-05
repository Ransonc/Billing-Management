'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/hooks/use-api';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/lib/constants';

const ROLE_REDIRECTS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: '/overview',
  [ROLES.OWNER]: '/dashboard',
  [ROLES.EMPLOYEE]: '/mobile/employee',
  [ROLES.CUSTOMER]: '/mobile/client',
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo');

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // 调用后端登录(后端负责 Supabase 认证 + 获取用户角色)
      const result = await api.post<{ redirectUrl: string }>('/api/auth/login', form);
      if (result?.data) {
        toast.success('登录成功');
        router.push(redirectTo || result.data.redirectUrl);
      }
    } catch {
      // api 层已处理 toast
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen gradient-header flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3">
            <span className="text-4xl">🐟</span>
            <h1 className="text-2xl font-bold text-white">渔智云</h1>
          </div>
          <p className="text-white/80 mt-2 text-sm">水产养殖经营管理平台</p>
        </div>

        {/* 登录卡片 */}
        <Card className="shadow-xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-800">欢迎登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">邮箱 / 手机号</Label>
                <Input
                  id="email"
                  type="text"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="请输入邮箱或手机号"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="请输入密码"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-header hover:opacity-90 border-0"
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              登录即表示同意《服务协议》和《隐私政策》
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

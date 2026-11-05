'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi, api } from '@/hooks/use-api';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import type { Role } from '@/lib/constants';
import type { Enterprise, User } from '@/types';

interface UserFormProps {
  userId?: string;
}

interface UserFormState {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
  enterpriseId: string;
}

export function UserForm({ userId }: UserFormProps) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [form, setForm] = useState<UserFormState>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: ROLES.OWNER,
    enterpriseId: '',
  });

  useEffect(() => {
    api
      .get<Paginated<Enterprise>>('/api/enterprises?page=1&pageSize=200')
      .then((res) => setEnterprises(res.data?.items || []))
      .catch(() => undefined);
    if (userId) {
      api.get<User>(`/api/users/${userId}`).then((res) => {
        const u = res.data;
        if (u) {
          setForm({
            email: u.email,
            password: '',
            name: u.name,
            phone: u.phone || '',
            role: u.role,
            enterpriseId: u.enterpriseId || '',
          });
        }
      });
    }
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      enterpriseId: form.role === ROLES.SUPER_ADMIN ? null : form.enterpriseId || null,
    };
    const result = userId
      ? await call(() => api.put(`/api/users/${userId}`, payload), {
          showSuccess: true,
          successMsg: '保存成功',
        })
      : await call(() => api.post('/api/users', payload), {
          showSuccess: true,
          successMsg: '用户创建成功',
        });
    if (result) router.push('/users');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{userId ? '编辑用户' : '新建用户'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>账号信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">登录邮箱 *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  disabled={Boolean(userId)}
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{userId ? '重置密码(留空不改)' : '初始密码'}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={userId ? '留空表示不修改' : '默认 12345678'}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>角色 *</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v || ROLES.OWNER }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLES).map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>所属企业</Label>
                <Select
                  value={form.enterpriseId || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, enterpriseId: v === 'none' ? '' : v || '' }))
                  }
                  disabled={form.role === ROLES.SUPER_ADMIN}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择企业" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不关联</SelectItem>
                    {enterprises.map((ent) => (
                      <SelectItem key={ent.id} value={ent.id}>
                        {ent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : userId ? '保存修改' : '创建用户'}
              </Button>
              <Link href="/users">
                <Button type="button" variant="outline">
                  取消
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type Paginated<T> = {
  items: T[];
  total: number;
};

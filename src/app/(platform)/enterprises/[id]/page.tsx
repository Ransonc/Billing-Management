'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi } from '@/hooks/use-api';
import { api } from '@/hooks/use-api';
import type { Enterprise } from '@/types';

export default function EnterpriseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { call, loading } = useApi<Enterprise>();
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    status: 'pending',
    subscription: 'free',
  });

  useEffect(() => {
    call(() => api.get<Enterprise>(`/api/enterprises/${params.id}`), { showError: false })
      .then((data) => {
        if (data) {
          setEnterprise(data);
          setForm({
            name: data.name,
            contactName: data.contactName || '',
            contactPhone: data.contactPhone || '',
            status: data.status || 'pending',
            subscription: data.subscription || 'free',
          });
        }
      });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(
      () => api.put(`/api/enterprises/${params.id}`, form),
      { showSuccess: true, successMsg: '保存成功' }
    );
    if (result) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm('确定要禁用此企业吗?')) return;
    const result = await call(
      () => api.delete(`/api/enterprises/${params.id}`),
      { showSuccess: true, successMsg: '企业已禁用' }
    );
    if (result) {
      router.push('/enterprises');
    }
  }

  if (!enterprise) {
    return <div className="py-20 text-center text-gray-400">加载中...</div>;
  }

  const count = (enterprise as Enterprise & { _count?: Record<string, number> })._count;

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/enterprises" className="text-sm text-gray-500 hover:text-gray-700">← 返回企业列表</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{enterprise.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <StatusBadge status={enterprise.status} />
          <span className="text-sm text-gray-500">创建于 {new Date(enterprise.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>基础信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="用户数" value={count?.users ?? 0} />
            <Stat label="客户数" value={count?.customers ?? 0} />
            <Stat label="鱼塘数" value={count?.fishPonds ?? 0} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>编辑信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">企业名称</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactName">联系人</Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPhone">联系电话</Label>
                <Input
                  id="contactPhone"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v || 'pending' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">待审核</SelectItem>
                    <SelectItem value="active">已激活</SelectItem>
                    <SelectItem value="inactive">已禁用</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>订阅套餐</Label>
                <Select value={form.subscription} onValueChange={(v) => setForm((f) => ({ ...f, subscription: v || 'free' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">免费版</SelectItem>
                    <SelectItem value="basic">基础版</SelectItem>
                    <SelectItem value="premium">高级版</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存修改'}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                禁用企业
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center py-3">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

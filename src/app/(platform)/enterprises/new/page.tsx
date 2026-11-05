'use client';

import { useState } from 'react';
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
import { useApi } from '@/hooks/use-api';
import { api } from '@/hooks/use-api';

export default function NewEnterprisePage() {
  const router = useRouter();
  const { call, loading } = useApi();
  const [form, setForm] = useState({
    name: '',
    contactName: '',
    contactPhone: '',
    status: 'pending',
    subscription: 'free',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(
      () => api.post('/api/enterprises', form),
      { showSuccess: true, successMsg: '企业创建成功' }
    );
    if (result) {
      router.push('/enterprises');
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="新建企业" />
      <Card>
        <CardHeader>
          <CardTitle>企业信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">企业名称 *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="请输入企业名称"
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                {loading ? '创建中...' : '创建企业'}
              </Button>
              <Link href="/enterprises">
                <Button type="button" variant="outline">取消</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
    </div>
  );
}

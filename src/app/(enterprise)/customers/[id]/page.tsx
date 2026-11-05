'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/hooks/use-api';
import { api } from '@/hooks/use-api';
import type { Customer } from '@/types';

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { call, loading } = useApi<Customer>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    notes: '',
  });

  useEffect(() => {
    call(() => api.get<Customer>(`/api/customers/${params.id}`), { showError: false })
      .then((data) => {
        if (data) {
          setCustomer(data);
          setForm({
            name: data.name,
            contactPerson: data.contactPerson || '',
            phone: data.phone || '',
            address: data.address || '',
            notes: data.notes || '',
          });
        }
      });
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(
      () => api.put(`/api/customers/${params.id}`, form),
      { showSuccess: true, successMsg: '保存成功' }
    );
    if (result) {
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm('确定要禁用此客户吗?')) return;
    const result = await call(
      () => api.delete(`/api/customers/${params.id}`),
      { showSuccess: true, successMsg: '客户已禁用' }
    );
    if (result) {
      router.push('/customers');
    }
  }

  if (!customer) {
    return <div className="py-20 text-center text-gray-400">加载中...</div>;
  }

  const customerDetail = customer as Customer & {
    debts?: { remainingAmount: number | string }[];
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <Link href="/customers" className="text-sm text-gray-500 hover:text-gray-700">← 返回客户列表</Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">{customer.name}</h1>
        <div className="flex items-center gap-3 mt-1">
          <StatusBadge status={customer.status} />
          <span className="text-sm text-gray-500">创建于 {new Date(customer.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>关联数据</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="鱼塘数" value={customerDetail._count?.fishPonds ?? 0} />
            <Stat label="未结清欠款" value={customerDetail.debts?.length ?? 0} />
            <Stat
              label="累计欠款"
              value={
                customerDetail.debts
                  ?.reduce((s, d) => s + Number(d.remainingAmount || 0), 0)
                  .toFixed(2) || '0'
              }
            />
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
              <Label htmlFor="name">客户名称</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">联系人</Label>
                <Input id="contactPerson" value={form.contactPerson} onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">联系电话</Label>
                <Input id="phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">地址</Label>
              <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">备注</Label>
              <Textarea id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存修改'}
              </Button>
              <Button type="button" variant="destructive" onClick={handleDelete}>
                禁用客户
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center py-3">
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

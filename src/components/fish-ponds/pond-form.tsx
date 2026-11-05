'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApi, api } from '@/hooks/use-api';
import { FISH_POND_STATUS_LABELS } from '@/lib/constants';
import type { Customer, FishPond } from '@/types';

interface PondFormProps {
  pondId?: string;
}

interface PondFormState {
  name: string;
  customerId: string;
  area: string;
  waterDepth: string;
  fishSpecies: string;
  stockDate: string;
  stockQuantity: string;
  stockWeight: string;
  status: string;
  notes: string;
}

const EMPTY: PondFormState = {
  name: '',
  customerId: '',
  area: '',
  waterDepth: '',
  fishSpecies: '',
  stockDate: '',
  stockQuantity: '',
  stockWeight: '',
  status: 'active',
  notes: '',
};

export function PondForm({ pondId }: PondFormProps) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<PondFormState>({ ...EMPTY });

  useEffect(() => {
    api
      .get<{ items: Customer[] }>('/api/customers?all=1')
      .then((res) => setCustomers(res.data?.items || []))
      .catch(() => undefined);
    if (pondId) {
      api.get<FishPond>(`/api/fish-ponds/${pondId}`).then((res) => {
        const p = res.data;
        if (p) {
          setForm({
            name: p.name,
            customerId: p.customerId || '',
            area: p.area != null ? String(p.area) : '',
            waterDepth: p.waterDepth != null ? String(p.waterDepth) : '',
            fishSpecies: p.fishSpecies || '',
            stockDate: p.stockDate ? p.stockDate.slice(0, 10) : '',
            stockQuantity: p.stockQuantity != null ? String(p.stockQuantity) : '',
            stockWeight: p.stockWeight != null ? String(p.stockWeight) : '',
            status: p.status,
            notes: p.notes || '',
          });
        }
      });
    }
  }, [pondId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = pondId
      ? await call(() => api.put(`/api/fish-ponds/${pondId}`, form), {
          showSuccess: true,
          successMsg: '保存成功',
        })
      : await call(() => api.post('/api/fish-ponds', form), {
          showSuccess: true,
          successMsg: '鱼塘创建成功',
        });
    if (result) {
      if (pondId) router.refresh();
      else router.push('/fish-ponds');
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{pondId ? '编辑鱼塘' : '新建鱼塘'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>鱼塘档案</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">鱼塘名称 *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="如:1号塘"
                />
              </div>
              <div className="space-y-1.5">
                <Label>所属客户</Label>
                <Select
                  value={form.customerId || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, customerId: v === 'none' ? '' : v || '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="自有鱼塘(不关联客户)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">自有鱼塘</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fishSpecies">养殖品种</Label>
                <Input
                  id="fishSpecies"
                  value={form.fishSpecies}
                  onChange={(e) => setForm((f) => ({ ...f, fishSpecies: e.target.value }))}
                  placeholder="如:草鱼"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stockDate">投放日期</Label>
                <Input
                  id="stockDate"
                  type="date"
                  value={form.stockDate}
                  onChange={(e) => setForm((f) => ({ ...f, stockDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="area">面积(亩)</Label>
                <Input
                  id="area"
                  type="number"
                  step="0.1"
                  value={form.area}
                  onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="waterDepth">水深(米)</Label>
                <Input
                  id="waterDepth"
                  type="number"
                  step="0.1"
                  value={form.waterDepth}
                  onChange={(e) => setForm((f) => ({ ...f, waterDepth: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stockQuantity">投放数量(尾)</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stockWeight">投放重量(斤)</Label>
                <Input
                  id="stockWeight"
                  type="number"
                  step="0.1"
                  value={form.stockWeight}
                  onChange={(e) => setForm((f) => ({ ...f, stockWeight: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v || 'active' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FISH_POND_STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : pondId ? '保存修改' : '创建鱼塘'}
              </Button>
              <Link href={pondId ? `/fish-ponds/${pondId}` : '/fish-ponds'}>
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

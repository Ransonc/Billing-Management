'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import type { DrugInventory, Customer, FishPond } from '@/types';

export default function NewSalePage() {
  const router = useRouter();
  const { call, loading } = useApi();
  const [drugs, setDrugs] = useState<DrugInventory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ponds, setPonds] = useState<FishPond[]>([]);
  const [form, setForm] = useState({
    drugId: '',
    customerId: '',
    fishPondId: '',
    quantity: '',
    unitPrice: '',
    paidAmount: '',
    saleDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  useEffect(() => {
    api.get<{ items: DrugInventory[] }>('/api/drugs?all=1').then((r) => setDrugs(r.data?.items || []));
    api.get<{ items: Customer[] }>('/api/customers?all=1').then((r) => setCustomers(r.data?.items || []));
    api.get<{ items: FishPond[] }>('/api/fish-ponds?all=1').then((r) => setPonds(r.data?.items || []));
  }, []);

  const selectedDrug = drugs.find((d) => d.id === form.drugId);
  const totalAmount =
    form.quantity && form.unitPrice ? Number(form.quantity) * Number(form.unitPrice) : 0;
  const paidAmount = form.paidAmount ? Number(form.paidAmount) : 0;
  const debtAmount = Math.max(0, totalAmount - paidAmount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post('/api/drugs/sale', form), {
      showSuccess: true,
      successMsg: '销售成功',
    });
    if (result) router.push('/sales');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">新建药品销售</h1>
      <Card>
        <CardHeader>
          <CardTitle>销售信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>药品 *</Label>
                <select
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.drugId}
                  onChange={(e) => {
                    const drug = drugs.find((d) => d.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      drugId: e.target.value,
                      unitPrice: drug?.salePrice != null ? String(drug.salePrice) : '',
                    }));
                  }}
                >
                  <option value="">请选择药品</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.stockQuantity <= 0}>
                      {d.name} (库存 {d.stockQuantity}
                      {d.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="saleDate">销售日期 *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  required
                  value={form.saleDate}
                  onChange={(e) => setForm((f) => ({ ...f, saleDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>客户{debtAmount > 0 ? ' *(赊账必选)' : ''}</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.customerId}
                  onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                >
                  <option value="">散客 / 不关联</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>关联鱼塘(可选)</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.fishPondId}
                  onChange={(e) => setForm((f) => ({ ...f, fishPondId: e.target.value }))}
                >
                  <option value="">不关联</option>
                  {ponds.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">销售数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
                {selectedDrug && (
                  <p className="text-xs text-gray-400">当前库存 {selectedDrug.stockQuantity}{selectedDrug.unit}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice">单价(元) *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  required
                  value={form.unitPrice}
                  onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paidAmount">本次收款(元)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  step="0.01"
                  value={form.paidAmount}
                  onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-gray-50 p-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">应收金额:</span>
                <span className="ml-2 font-semibold text-gray-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">本次收款:</span>
                <span className="ml-2 font-semibold text-green-600">{formatCurrency(paidAmount)}</span>
              </div>
              <div>
                <span className="text-gray-500">形成欠款:</span>
                <span className={`ml-2 font-semibold ${debtAmount > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                  {formatCurrency(debtAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">备注</Label>
              <Textarea
                id="notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : '确认销售出库'}
              </Button>
              <Link href="/sales">
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

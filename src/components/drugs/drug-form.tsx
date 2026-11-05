'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi, api } from '@/hooks/use-api';
import type { DrugInventory } from '@/types';

interface DrugFormProps {
  drugId?: string;
}

const EMPTY = {
  name: '',
  specification: '',
  unit: '瓶',
  supplier: '',
  purchasePrice: '',
  salePrice: '',
  stockQuantity: '0',
  safetyStock: '0',
  status: 'active',
};

export function DrugForm({ drugId }: DrugFormProps) {
  const router = useRouter();
  const { call, loading } = useApi();
  const [form, setForm] = useState({ ...EMPTY });

  useEffect(() => {
    if (drugId) {
      api.get<DrugInventory>(`/api/drugs/${drugId}`).then((res) => {
        const d = res.data;
        if (d) {
          setForm({
            name: d.name,
            specification: d.specification || '',
            unit: d.unit,
            supplier: d.supplier || '',
            purchasePrice: d.purchasePrice != null ? String(d.purchasePrice) : '',
            salePrice: d.salePrice != null ? String(d.salePrice) : '',
            stockQuantity: String(d.stockQuantity),
            safetyStock: String(d.safetyStock),
            status: d.status,
          });
        }
      });
    }
  }, [drugId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form };
    const result = drugId
      ? await call(() => api.put(`/api/drugs/${drugId}`, payload), {
          showSuccess: true,
          successMsg: '保存成功',
        })
      : await call(() => api.post('/api/drugs', payload), {
          showSuccess: true,
          successMsg: '药品创建成功',
        });
    if (result) router.push('/drugs');
  }

  async function handleDelete() {
    if (!confirm('确定停用该药品吗?历史进销记录会保留。')) return;
    const result = await call(() => api.delete(`/api/drugs/${drugId}`), {
      showSuccess: true,
      successMsg: '药品已停用',
    });
    if (result) router.push('/drugs');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{drugId ? '编辑药品' : '新增药品'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>药品信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">药品名称 *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="specification">规格</Label>
                <Input
                  id="specification"
                  placeholder="如:500ml/瓶"
                  value={form.specification}
                  onChange={(e) => setForm((f) => ({ ...f, specification: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="unit">单位 *</Label>
                <Input
                  id="unit"
                  required
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">成本价(元)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salePrice">销售价(元)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="stockQuantity">初始库存</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  disabled={Boolean(drugId)}
                  value={form.stockQuantity}
                  onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="safetyStock">安全库存</Label>
                <Input
                  id="safetyStock"
                  type="number"
                  value={form.safetyStock}
                  onChange={(e) => setForm((f) => ({ ...f, safetyStock: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">供应商</Label>
                <Input
                  id="supplier"
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                />
              </div>
            </div>
            {drugId && (
              <p className="text-xs text-gray-400">库存数量只能通过采购入库 / 销售出库变动</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : drugId ? '保存修改' : '创建药品'}
              </Button>
              {drugId && (
                <Button type="button" variant="destructive" onClick={handleDelete}>
                  停用药品
                </Button>
              )}
              <Link href="/drugs">
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

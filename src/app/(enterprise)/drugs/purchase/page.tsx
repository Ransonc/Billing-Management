'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { DrugInventory, DrugPurchase, PaginatedResponse } from '@/types';

export default function PurchasePage() {
  const [drugs, setDrugs] = useState<DrugInventory[]>([]);
  const [records, setRecords] = useState<DrugPurchase[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const { call, loading } = useApi();
  const [form, setForm] = useState({
    drugId: '',
    supplier: '',
    quantity: '',
    unitPrice: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  function loadRecords(p = page) {
    api
      .get<PaginatedResponse<DrugPurchase>>(`/api/drugs/purchase?page=${p}&pageSize=20`)
      .then((res) => {
        if (res.data) {
          setRecords(res.data.items);
          setTotal(res.data.total);
        }
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    api
      .get<{ items: DrugInventory[] }>('/api/drugs?all=1')
      .then((res) => setDrugs(res.data?.items || []))
      .catch(() => undefined);
    loadRecords(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post('/api/drugs/purchase', form), {
      showSuccess: true,
      successMsg: '采购入库成功,库存已更新',
    });
    if (result) {
      setForm((f) => ({ ...f, quantity: '', unitPrice: '', notes: '' }));
      loadRecords(1);
      setPage(1);
    }
  }

  const columns = [
    {
      key: 'purchaseDate',
      header: '采购日期',
      render: (row: DrugPurchase) => formatDate(row.purchaseDate),
    },
    { key: 'drug', header: '药品', render: (row: DrugPurchase) => row.drug?.name || '-' },
    { key: 'supplier', header: '供应商' },
    { key: 'quantity', header: '数量', render: (row: DrugPurchase) => `${row.quantity}` },
    { key: 'unitPrice', header: '单价', render: (row: DrugPurchase) => formatCurrency(row.unitPrice) },
    { key: 'totalCost', header: '总价', render: (row: DrugPurchase) => formatCurrency(row.totalCost) },
  ];

  return (
    <div>
      <PageHeader title="药品采购" description="采购入库自动增加库存并更新成本价" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新增采购单</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
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
                      unitPrice: drug?.purchasePrice != null ? String(drug.purchasePrice) : f.unitPrice,
                      supplier: drug?.supplier || f.supplier,
                    }));
                  }}
                >
                  <option value="">请选择药品</option>
                  {drugs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}(库存 {d.stockQuantity}
                      {d.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">供应商 *</Label>
                <Input
                  id="supplier"
                  required
                  value={form.supplier}
                  onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchaseDate">采购日期 *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  required
                  value={form.purchaseDate}
                  onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="quantity">采购数量 *</Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unitPrice">采购单价 *</Label>
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
                <Label>合计金额</Label>
                <div className="h-9 flex items-center px-3 text-sm font-medium bg-gray-50 rounded-md border">
                  {form.quantity && form.unitPrice
                    ? formatCurrency(Number(form.quantity) * Number(form.unitPrice))
                    : '-'}
                </div>
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
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : '确认入库'}
              </Button>
              <Link href="/drugs">
                <Button type="button" variant="outline">
                  返回库存
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>采购历史</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={records} loading={loading} emptyText="暂无采购记录" />
          <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}

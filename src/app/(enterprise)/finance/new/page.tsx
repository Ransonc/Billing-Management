'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApi, api } from '@/hooks/use-api';
import { FINANCE_CATEGORIES, FINANCE_CATEGORY_LABELS } from '@/lib/constants';

// 支出分类
const EXPENSE_CATEGORIES = [
  FINANCE_CATEGORIES.DRUG_PURCHASE,
  FINANCE_CATEGORIES.SALARY,
  FINANCE_CATEGORIES.RENT,
  FINANCE_CATEGORIES.WATER_ELECTRIC,
  FINANCE_CATEGORIES.COMMISSION,
  FINANCE_CATEGORIES.LOGISTICS,
  FINANCE_CATEGORIES.TRAVEL,
  FINANCE_CATEGORIES.ENTERTAINMENT,
  FINANCE_CATEGORIES.SOFTWARE_DEVICE,
  FINANCE_CATEGORIES.AFTER_SALES,
  FINANCE_CATEGORIES.OTHER,
];
// 收入分类
const INCOME_CATEGORIES = [FINANCE_CATEGORIES.SALES, FINANCE_CATEGORIES.OTHER];

export default function NewFinancePage() {
  const router = useRouter();
  const { call, loading } = useApi();
  const [form, setForm] = useState<{
    type: string;
    category: string;
    amount: string;
    description: string;
    recordDate: string;
  }>({
    type: 'expense',
    category: FINANCE_CATEGORIES.OTHER,
    amount: '',
    description: '',
    recordDate: new Date().toISOString().slice(0, 10),
  });

  const categoryOptions = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post('/api/finance', form), {
      showSuccess: true,
      successMsg: '记账成功',
    });
    if (result) router.push('/finance');
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">记一笔</h1>
      <Card>
        <CardHeader>
          <CardTitle>收支信息</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>类型 *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.type === 'income' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        type: 'income',
                        category: FINANCE_CATEGORIES.SALES,
                      }))
                    }
                  >
                    收入
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === 'expense' ? 'destructive' : 'outline'}
                    className="flex-1"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        type: 'expense',
                        category: FINANCE_CATEGORIES.OTHER,
                      }))
                    }
                  >
                    支出
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="recordDate">日期 *</Label>
                <Input
                  id="recordDate"
                  type="date"
                  required
                  value={form.recordDate}
                  onChange={(e) => setForm((f) => ({ ...f, recordDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>分类 *</Label>
                <select
                  required
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {FINANCE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount">金额(元) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">说明</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="收支事项说明"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
              <Link href="/finance">
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

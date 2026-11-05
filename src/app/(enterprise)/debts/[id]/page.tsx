'use client';

import { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SignaturePad } from '@/components/debts/signature-pad';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/lib/constants';

interface DebtDetail {
  id: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  signImageUrl?: string | null;
  signDate?: string | null;
  createdAt: string;
  customer: { id: string; name: string; phone?: string | null };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string | null;
    notes?: string | null;
  }>;
}

export default function DebtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { call, loading } = useApi();
  const [debt, setDebt] = useState<DebtDetail | null>(null);
  const [signData, setSignData] = useState('');
  const [payment, setPayment] = useState<{
    amount: string;
    paymentDate: string;
    paymentMethod: string;
    notes: string;
  }>({
    amount: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: PAYMENT_METHODS.CASH,
    notes: '',
  });

  const load = useCallback(() => {
    api
      .get<DebtDetail>(`/api/debts/${id}`)
      .then((res) => setDebt(res.data ?? null))
      .catch(() => undefined);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSignature() {
    if (!signData) return;
    const result = await call(() => api.patch(`/api/debts/${id}`, { signImageUrl: signData }), {
      showSuccess: true,
      successMsg: '签名已保存',
    });
    if (result) {
      setSignData('');
      load();
    }
  }

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post(`/api/debts/${id}/payments`, payment), {
      showSuccess: true,
      successMsg: '回款已登记',
    });
    if (result) {
      setPayment((p) => ({ ...p, amount: '', notes: '' }));
      load();
    }
  }

  if (!debt) return <div className="py-20 text-center text-gray-400">加载中...</div>;

  return (
    <div className="max-w-3xl">
      <Link href="/debts" className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回欠款列表
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">
        欠款单 · {debt.customer.name}
      </h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Box label="欠款总额" value={formatCurrency(debt.totalAmount)} />
        <Box label="已回款" value={formatCurrency(debt.paidAmount)} color="text-green-600" />
        <Box label="待回款" value={formatCurrency(debt.remainingAmount)} color="text-red-600" />
        <Box
          label="状态"
          value={debt.status === 'settled' ? '已结清' : debt.status === 'partial' ? '部分回款' : '待回款'}
        />
      </div>

      {/* 电子签名 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>客户电子签名</CardTitle>
        </CardHeader>
        <CardContent>
          {debt.signImageUrl ? (
            <div>
              <img
                src={debt.signImageUrl}
                alt="客户签名"
                className="max-h-40 border rounded-lg bg-white"
              />
              <p className="text-xs text-gray-400 mt-2">
                签署时间:{debt.signDate ? formatDateTime(debt.signDate) : '-'}
              </p>
              {signData === '' && (
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setSignData(' ')}>
                  重新签名
                </Button>
              )}
            </div>
          ) : null}
          {(!debt.signImageUrl || signData !== '') && (
            <div className="space-y-3">
              <SignaturePad initialDataUrl={null} onChange={setSignData} />
              <Button onClick={saveSignature} disabled={!signData.trim() || loading}>
                保存签名
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 登记回款 */}
      {debt.status !== 'settled' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>登记回款</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addPayment} className="grid grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="amount">回款金额 *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  max={debt.remainingAmount}
                  required
                  value={payment.amount}
                  onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="paymentDate">回款日期 *</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  required
                  value={payment.paymentDate}
                  onChange={(e) => setPayment((p) => ({ ...p, paymentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>回款方式</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                  value={payment.paymentMethod}
                  onChange={(e) => setPayment((p) => ({ ...p, paymentMethod: e.target.value }))}
                >
                  {Object.values(PAYMENT_METHODS).map((m) => (
                    <option key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : '确认回款'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 回款明细 */}
      <Card>
        <CardHeader>
          <CardTitle>回款明细 ({debt.payments.length} 笔)</CardTitle>
        </CardHeader>
        <CardContent>
          {debt.payments.length === 0 ? (
            <div className="py-8 text-center text-gray-400">暂无回款记录</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">日期</th>
                    <th className="text-left font-medium px-4 py-2.5">金额</th>
                    <th className="text-left font-medium px-4 py-2.5">方式</th>
                    <th className="text-left font-medium px-4 py-2.5">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {debt.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2.5">{formatDate(p.paymentDate)}</td>
                      <td className="px-4 py-2.5 text-green-600 font-medium">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-2.5">{PAYMENT_METHOD_LABELS[p.paymentMethod || ''] || '-'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Box({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold mt-1 ${color || 'text-gray-800'}`}>{value}</div>
    </div>
  );
}

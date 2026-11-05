'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import { DEFAULT_COMMISSION_RATE, COMMISSION_STATUS_LABELS } from '@/lib/constants';

interface CommissionRow {
  userId: string;
  userName: string;
  email: string;
  salesAmount: number;
  commissionRecord: {
    id: string;
    commissionRate: number;
    commissionAmount: number;
    status: string;
  } | null;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function CommissionPage() {
  const { call, loading } = useApi();
  const [month, setMonth] = useState(currentMonth());
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});

  const load = useCallback((m: string) => {
    api
      .get<{ items: CommissionRow[] }>(`/api/commission?month=${m}`)
      .then((r) => {
        const items = r.data?.items || [];
        setRows(items);
        setRates(
          Object.fromEntries(
            items.map((it) => [
              it.userId,
              String(it.commissionRecord?.commissionRate || DEFAULT_COMMISSION_RATE),
            ])
          )
        );
      });
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  async function generate(row: CommissionRow) {
    const rate = Number(rates[row.userId] || DEFAULT_COMMISSION_RATE);
    const result = await call(
      () => api.post('/api/commission', { userId: row.userId, periodMonth: month, rate }),
      { showSuccess: true, successMsg: '提成已生成' }
    );
    if (result) load(month);
  }

  async function changeStatus(recordId: string, action: 'confirm' | 'pay') {
    const result = await call(() => api.patch('/api/commission', { recordId, action }), {
      showSuccess: true,
      successMsg: action === 'confirm' ? '已确认' : '已标记发放',
    });
    if (result) load(month);
  }

  const totalSales = rows.reduce((s, r) => s + r.salesAmount, 0);
  const totalCommission = rows.reduce((s, r) => s + (r.commissionRecord?.commissionAmount || 0), 0);

  return (
    <div>
      <PageHeader
        title="员工提成"
        description="按月份汇总员工销售额并计算提成"
        actions={
          <Input
            type="month"
            className="w-40"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">{month} 销售总额</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(totalSales)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">{month} 提成总额</div>
          <div className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalCommission)}</div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {rows.length === 0 ? (
            <div className="py-12 text-center text-gray-400">该月暂无员工数据</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">员工</th>
                    <th className="text-right font-medium px-4 py-2.5">当月销售额</th>
                    <th className="text-right font-medium px-4 py-2.5">提成比例(%)</th>
                    <th className="text-right font-medium px-4 py-2.5">提成金额</th>
                    <th className="text-center font-medium px-4 py-2.5">状态</th>
                    <th className="text-center font-medium px-4 py-2.5">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((row) => (
                    <tr key={row.userId}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{row.userName}</div>
                        <div className="text-xs text-gray-400">{row.email}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatCurrency(row.salesAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          step="0.1"
                          className="w-20 ml-auto text-right"
                          value={rates[row.userId] || ''}
                          onChange={(e) =>
                            setRates((s) => ({ ...s, [row.userId]: e.target.value }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-primary">
                        {row.commissionRecord ? formatCurrency(row.commissionRecord.commissionAmount) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.commissionRecord ? (
                          <span className="text-xs text-gray-600">
                            {COMMISSION_STATUS_LABELS[row.commissionRecord.status]}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">未生成</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="outline" disabled={loading} onClick={() => generate(row)}>
                            {row.commissionRecord ? '重算' : '生成'}
                          </Button>
                          {row.commissionRecord?.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={loading}
                              onClick={() => changeStatus(row.commissionRecord!.id, 'confirm')}
                            >
                              确认
                            </Button>
                          )}
                          {row.commissionRecord && row.commissionRecord.status !== 'paid' && (
                            <Button
                              size="sm"
                              disabled={loading}
                              onClick={() => changeStatus(row.commissionRecord!.id, 'pay')}
                            >
                              发放
                            </Button>
                          )}
                          {row.commissionRecord?.status === 'paid' && (
                            <span className="text-xs text-green-600 self-center">✓ 已发放</span>
                          )}
                        </div>
                      </td>
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

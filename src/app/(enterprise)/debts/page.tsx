'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Debt, PaginatedResponse } from '@/types';

interface DebtListResponse extends PaginatedResponse<Debt> {
  totalRemaining: number;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [total, setTotal] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { call, loading } = useApi<DebtListResponse>();
  const pageSize = 20;

  useEffect(() => {
    call(
      () =>
        api.get<DebtListResponse>(
          `/api/debts?page=${page}&pageSize=${pageSize}&status=${status}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setDebts(data.items);
        setTotal(data.total);
        setTotalRemaining(data.totalRemaining || 0);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const columns = [
    {
      key: 'customer',
      header: '客户',
      render: (row: Debt) => (
        <Link href={`/debts/${row.id}`} className="text-primary hover:underline">
          {row.customer?.name || '-'}
        </Link>
      ),
    },
    { key: 'totalAmount', header: '欠款总额', render: (row: Debt) => formatCurrency(row.totalAmount) },
    { key: 'paidAmount', header: '已回款', render: (row: Debt) => formatCurrency(row.paidAmount) },
    {
      key: 'remainingAmount',
      header: '待回款',
      render: (row: Debt) => <span className="text-red-600 font-medium">{formatCurrency(row.remainingAmount)}</span>,
    },
    {
      key: 'status',
      header: '状态',
      render: (row: Debt) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded border ${
            row.status === 'settled'
              ? 'bg-green-50 text-green-600 border-green-200'
              : row.status === 'partial'
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-orange-50 text-orange-600 border-orange-200'
          }`}
        >
          {row.status === 'settled' ? '已结清' : row.status === 'partial' ? '部分回款' : '待回款'}
        </span>
      ),
    },
    {
      key: 'sign',
      header: '签名',
      render: (row: Debt) => (row.signImageUrl ? <span className="text-green-600">✓ 已签</span> : <span className="text-gray-400">未签</span>),
    },
    { key: 'createdAt', header: '产生时间', render: (row: Debt) => formatDate(row.createdAt) },
  ];

  return (
    <div>
      <PageHeader title="欠款与回款" description="销售未付清自动生成欠款单,支持分批回款与电子签名" />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border p-4 col-span-1">
          <div className="text-sm text-gray-500">未结清欠款总额</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalRemaining)}</div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {[
          { v: '', l: '全部' },
          { v: 'pending', l: '待回款' },
          { v: 'partial', l: '部分回款' },
          { v: 'settled', l: '已结清' },
        ].map((o) => (
          <Button key={o.v} variant={status === o.v ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(o.v); setPage(1); }}>
            {o.l}
          </Button>
        ))}
      </div>

      <DataTable columns={columns} data={debts} loading={loading} emptyText="暂无欠款单" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { FINANCE_CATEGORY_LABELS } from '@/lib/constants';
import type { FinanceRecord, PaginatedResponse } from '@/types';

interface FinanceListResponse extends PaginatedResponse<FinanceRecord> {
  totalIncome: number;
  totalExpense: number;
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function FinancePage() {
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const { call, loading } = useApi<FinanceListResponse>();
  const pageSize = 20;

  function load(p = page) {
    call(
      () =>
        api.get<FinanceListResponse>(
          `/api/finance?page=${p}&pageSize=${pageSize}&type=${type}&month=${month}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setRecords(data.items);
        setTotal(data.total);
        setTotalIncome(data.totalIncome || 0);
        setTotalExpense(data.totalExpense || 0);
      }
    });
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, month]);

  async function handleDelete(row: FinanceRecord) {
    if (!confirm('确定删除这条记录吗?')) return;
    const result = await call(() => api.delete(`/api/finance/${row.id}`), {
      showSuccess: true,
      successMsg: '已删除',
    });
    if (result) load();
  }

  const columns = [
    { key: 'recordDate', header: '日期', render: (row: FinanceRecord) => formatDate(row.recordDate) },
    {
      key: 'type',
      header: '类型',
      render: (row: FinanceRecord) => (
        <span className={row.type === 'income' ? 'text-green-600' : 'text-red-600'}>
          {row.type === 'income' ? '收入' : '支出'}
        </span>
      ),
    },
    {
      key: 'category',
      header: '分类',
      render: (row: FinanceRecord) => FINANCE_CATEGORY_LABELS[row.category] || row.category,
    },
    { key: 'description', header: '说明', render: (row: FinanceRecord) => row.description || '-' },
    {
      key: 'amount',
      header: '金额',
      render: (row: FinanceRecord) => (
        <span className={row.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {row.type === 'income' ? '+' : '-'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: FinanceRecord) => (
        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(row)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="财务管理"
        description="日常收入与支出记账"
        actions={
          <Link href="/finance/new">
            <Button>+ 记一笔</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">本期收入</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">本期支出</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm text-gray-500">本期结余</div>
          <div className="text-2xl font-bold text-gray-800 mt-1">
            {formatCurrency(totalIncome - totalExpense)}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mb-4 items-center">
        <input
          type="month"
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={month}
          onChange={(e) => {
            setMonth(e.target.value);
            setPage(1);
          }}
        />
        {[
          { v: '', l: '全部' },
          { v: 'income', l: '仅收入' },
          { v: 'expense', l: '仅支出' },
        ].map((o) => (
          <Button
            key={o.v}
            variant={type === o.v ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setType(o.v);
              setPage(1);
            }}
          >
            {o.l}
          </Button>
        ))}
        <Link href="/reports/profit" className="ml-auto">
          <Button variant="outline" size="sm">
            利润链报表 ›
          </Button>
        </Link>
      </div>

      <DataTable columns={columns} data={records} loading={loading} emptyText="暂无记录" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

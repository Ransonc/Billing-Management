'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PAYMENT_STATUS_LABELS } from '@/lib/constants';
import type { DrugSale, PaginatedResponse } from '@/types';

export default function SalesPage() {
  const [sales, setSales] = useState<DrugSale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { call, loading } = useApi<PaginatedResponse<DrugSale>>();
  const pageSize = 20;

  useEffect(() => {
    call(
      () =>
        api.get<PaginatedResponse<DrugSale>>(
          `/api/drugs/sale?page=${page}&pageSize=${pageSize}&paymentStatus=${status}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setSales(data.items);
        setTotal(data.total);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const columns = [
    { key: 'saleDate', header: '销售日期', render: (row: DrugSale) => formatDate(row.saleDate) },
    { key: 'drug', header: '药品', render: (row: DrugSale) => row.drug?.name || '-' },
    { key: 'customer', header: '客户', render: (row: DrugSale) => row.customer?.name || '-' },
    { key: 'quantity', header: '数量', render: (row: DrugSale) => `${row.quantity} ${row.drug?.unit || ''}` },
    { key: 'totalAmount', header: '应收', render: (row: DrugSale) => formatCurrency(row.totalAmount) },
    { key: 'paidAmount', header: '已收', render: (row: DrugSale) => formatCurrency(row.paidAmount) },
    {
      key: 'debtAmount',
      header: '欠款',
      render: (row: DrugSale) =>
        row.debtAmount > 0 ? (
          <span className="text-red-600">{formatCurrency(row.debtAmount)}</span>
        ) : (
          '-'
        ),
    },
    {
      key: 'paymentStatus',
      header: '状态',
      render: (row: DrugSale) => (
        <StatusBadge status={row.paymentStatus} label={PAYMENT_STATUS_LABELS[row.paymentStatus]} />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="药品销售"
        description="销售出库自动扣减库存,未付清自动生成欠款单"
        actions={
          <Link href="/sales/new">
            <Button>+ 新建销售</Button>
          </Link>
        }
      />

      <div className="flex gap-2 mb-4">
        {[
          { v: '', l: '全部' },
          { v: 'unpaid', l: '未付款' },
          { v: 'partial', l: '部分付款' },
          { v: 'paid', l: '已付清' },
        ].map((o) => (
          <Button key={o.v} variant={status === o.v ? 'default' : 'outline'} size="sm" onClick={() => { setStatus(o.v); setPage(1); }}>
            {o.l}
          </Button>
        ))}
      </div>

      <DataTable columns={columns} data={sales} loading={loading} emptyText="暂无销售记录" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

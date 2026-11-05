'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';
import { FISH_POND_STATUS_LABELS } from '@/lib/constants';
import type { FishPond, Customer, PaginatedResponse } from '@/types';

export default function FishPondsPage() {
  const [ponds, setPonds] = useState<FishPond[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [customerId, setCustomerId] = useState('');
  const { call, loading } = useApi<PaginatedResponse<FishPond>>();

  const pageSize = 20;

  useEffect(() => {
    api
      .get<{ items: Customer[] }>('/api/customers?all=1')
      .then((res) => setCustomers(res.data?.items || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    call(
      () =>
        api.get<PaginatedResponse<FishPond>>(
          `/api/fish-ponds?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
            search
          )}&customerId=${customerId}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setPonds(data.items);
        setTotal(data.total);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, customerId]);

  const columns = [
    {
      key: 'name',
      header: '鱼塘名称',
      render: (row: FishPond) => (
        <Link href={`/fish-ponds/${row.id}`} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: '所属客户',
      render: (row: FishPond) => row.customer?.name || (
        <span className="text-gray-400">自有</span>
      ),
    },
    { key: 'fishSpecies', header: '养殖品种', render: (row: FishPond) => row.fishSpecies || '-' },
    {
      key: 'area',
      header: '面积(亩)',
      render: (row: FishPond) => (row.area != null ? Number(row.area) : '-'),
    },
    {
      key: 'stockQuantity',
      header: '投放数量',
      render: (row: FishPond) => row.stockQuantity ?? '-',
    },
    {
      key: 'stockDate',
      header: '投放日期',
      render: (row: FishPond) => formatDate(row.stockDate),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: FishPond) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded border ${
            row.status === 'active'
              ? 'bg-green-50 text-green-600 border-green-200'
              : row.status === 'sold_out'
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {FISH_POND_STATUS_LABELS[row.status] || row.status}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="鱼塘管理"
        description="管理鱼塘档案与养殖台账"
        actions={
          <Link href="/fish-ponds/new">
            <Button>+ 新建鱼塘</Button>
          </Link>
        }
      />

      <div className="flex gap-2 mb-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
        >
          <Input
            placeholder="搜索鱼塘名称 / 品种"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            搜索
          </Button>
        </form>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={customerId}
          onChange={(e) => {
            setCustomerId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部客户</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <DataTable columns={columns} data={ponds} loading={loading} emptyText="暂无鱼塘" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { useApi } from '@/hooks/use-api';
import { api } from '@/hooks/use-api';
import type { Customer, PaginatedResponse } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { call, loading } = useApi<PaginatedResponse<Customer>>();

  const pageSize = 20;

  useEffect(() => {
    call(() => api.get<PaginatedResponse<Customer>>(`/api/customers?page=${page}&pageSize=${pageSize}&search=${search}`), { showError: false })
      .then((data) => {
        if (data) {
          setCustomers(data.items);
          setTotal(data.total);
        }
      });
  }, [page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const columns = [
    { key: 'name', header: '客户名称', render: (row: Customer) => (
      <Link href={`/customers/${row.id}`} className="text-primary hover:underline">{row.name}</Link>
    )},
    { key: 'contactPerson', header: '联系人' },
    { key: 'phone', header: '联系电话' },
    { key: 'address', header: '地址', className: 'hidden md:table-cell' },
    { key: 'fishPonds', header: '鱼塘数', render: (row: Customer) => row._count?.fishPonds ?? 0 },
    { key: 'status', header: '状态', render: (row: Customer) => <StatusBadge status={row.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="客户管理"
        description="管理企业客户档案"
        actions={
          <Link href="/customers/new">
            <Button>+ 新建客户</Button>
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="搜索客户名称、联系人、电话"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">搜索</Button>
      </form>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyText="暂无客户"
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
      />
    </div>
  );
}

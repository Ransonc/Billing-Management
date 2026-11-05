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
import type { Enterprise, PaginatedResponse } from '@/types';

export default function EnterprisesPage() {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { call, loading } = useApi<PaginatedResponse<Enterprise>>();

  const pageSize = 20;

  useEffect(() => {
    call(() => api.get<PaginatedResponse<Enterprise>>(`/api/enterprises?page=${page}&pageSize=${pageSize}&search=${search}`), { showError: false })
      .then((data) => {
        if (data) {
          setEnterprises(data.items);
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
    { key: 'name', header: '企业名称', render: (row: Enterprise) => (
      <Link href={`/enterprises/${row.id}`} className="text-primary hover:underline">{row.name}</Link>
    )},
    { key: 'contactName', header: '联系人' },
    { key: 'contactPhone', header: '联系电话' },
    { key: 'createdAt', header: '入驻时间', render: (row: Enterprise) => new Date(row.createdAt).toLocaleDateString('zh-CN') },
    {
      key: 'userCount',
      header: '用户数',
      render: (row: Enterprise) =>
        (row as Enterprise & { _count?: { users?: number } })._count?.users ?? 0,
    },
    { key: 'status', header: '状态', render: (row: Enterprise) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '操作', render: (row: Enterprise) => (
      <Link href={`/enterprises/${row.id}`} className="text-primary text-sm hover:underline">
        详情
      </Link>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="企业管理"
        description="管理平台入驻企业,支持审核、编辑、禁用"
        actions={
          <Link href="/enterprises/new">
            <Button>+ 新建企业</Button>
          </Link>
        }
      />

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          placeholder="搜索企业名称、联系人、电话"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">搜索</Button>
      </form>

      <DataTable
        columns={columns}
        data={enterprises}
        loading={loading}
        emptyText="暂无企业"
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

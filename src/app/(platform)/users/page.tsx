'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { ROLES, ROLE_LABELS } from '@/lib/constants';
import type { User, PaginatedResponse } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [role, setRole] = useState('');
  const { call, loading } = useApi<PaginatedResponse<User>>();

  const pageSize = 20;

  function load(p = page, r = role, s = search) {
    call(
      () =>
        api.get<PaginatedResponse<User>>(
          `/api/users?page=${p}&pageSize=${pageSize}&search=${encodeURIComponent(s)}&role=${r}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setUsers(data.items);
        setTotal(data.total);
      }
    });
  }

  useEffect(() => {
    load(page, role, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, role, search]);

  async function toggleActive(user: User) {
    if (!confirm(`确定要${user.isActive ? '禁用' : '启用'} ${user.name} 吗?`)) return;
    const result = await call(
      () => api.patch(`/api/users/${user.id}`, { isActive: !user.isActive }),
      { showSuccess: true, successMsg: '操作成功' }
    );
    if (result) load();
  }

  const columns = [
    {
      key: 'name',
      header: '姓名',
      render: (row: User) => (
        <Link href={`/users/${row.id}`} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: 'email', header: '邮箱' },
    { key: 'phone', header: '手机号', render: (row: User) => row.phone || '-' },
    {
      key: 'role',
      header: '角色',
      render: (row: User) => (
        <span className="text-sm">{ROLE_LABELS[row.role] || row.role}</span>
      ),
    },
    {
      key: 'enterprise',
      header: '所属企业',
      render: (row: User) =>
        row.role === ROLES.SUPER_ADMIN ? (
          <span className="text-gray-400">平台</span>
        ) : (
          row.enterprise?.name || '-'
        ),
    },
    {
      key: 'isActive',
      header: '状态',
      render: (row: User) => (
        <span
          className={`inline-block px-2 py-0.5 text-xs rounded border ${
            row.isActive
              ? 'bg-green-50 text-green-600 border-green-200'
              : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}
        >
          {row.isActive ? '正常' : '已禁用'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '操作',
      render: (row: User) => (
        <Button variant="outline" size="sm" onClick={() => toggleActive(row)}>
          {row.isActive ? '禁用' : '启用'}
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="用户管理"
        description="管理平台所有登录账号与角色"
        actions={
          <Link href="/users/new">
            <Button>+ 新建用户</Button>
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
            placeholder="搜索姓名 / 邮箱 / 手机号"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-64"
          />
          <Button type="submit" variant="outline">
            搜索
          </Button>
        </form>
        <Select
          value={role || 'all'}
          onValueChange={(v) => {
            setRole(v === 'all' ? '' : v || '');
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="全部角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            {Object.values(ROLES).map((r) => (
              <SelectItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={users} loading={loading} emptyText="暂无用户" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatDateTime } from '@/lib/utils';
import type { AuditLog, PaginatedResponse } from '@/types';

type AuditLogRow = AuditLog & { actionLabel: string; moduleLabel: string };

const MODULE_OPTIONS = [
  { value: 'enterprise', label: '企业' },
  { value: 'user', label: '用户' },
  { value: 'customer', label: '客户' },
  { value: 'fish_pond', label: '鱼塘' },
  { value: 'drug', label: '药品' },
  { value: 'drug_purchase', label: '药品采购' },
  { value: 'drug_sale', label: '药品销售' },
  { value: 'debt', label: '欠款' },
  { value: 'finance', label: '财务' },
  { value: 'commission', label: '提成' },
  { value: 'attendance', label: '考勤' },
  { value: 'water_quality', label: '水质检测' },
  { value: 'market_price', label: '批发行情' },
];

const ACTION_OPTIONS = [
  { value: 'create', label: '新增' },
  { value: 'update', label: '修改' },
  { value: 'delete', label: '删除' },
  { value: 'import', label: '导入' },
  { value: 'export', label: '导出' },
  { value: 'subscribe', label: '订阅' },
  { value: 'login', label: '登录' },
];

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}

// 平台超管 - 操作审计日志
export default function AuditLogsPage() {
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState(defaultStart());
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const { call, loading } = useApi<PaginatedResponse<AuditLogRow>>();
  const pageSize = 20;

  function load(p = page) {
    const params = new URLSearchParams({ page: String(p), pageSize: String(pageSize) });
    if (module) params.set('module', module);
    if (action) params.set('action', action);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    call(() => api.get<PaginatedResponse<AuditLogRow>>(`/api/audit-logs?${params.toString()}`), {
      showError: false,
    }).then((r) => {
      if (r) {
        setItems(r.items);
        setTotal(r.total);
      }
    });
  }

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, module, action, startDate, endDate]);

  const columns = [
    {
      key: 'createdAt',
      header: '时间',
      render: (row: AuditLogRow) => <span className="whitespace-nowrap">{formatDateTime(row.createdAt)}</span>,
    },
    { key: 'userEmail', header: '操作人', render: (row: AuditLogRow) => row.userEmail || row.userId || '-' },
    {
      key: 'moduleLabel',
      header: '模块',
      render: (row: AuditLogRow) => (
        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">{row.moduleLabel}</span>
      ),
    },
    {
      key: 'actionLabel',
      header: '动作',
      render: (row: AuditLogRow) => {
        const color =
          row.action === 'delete'
            ? 'bg-red-50 text-red-600'
            : row.action === 'create'
              ? 'bg-green-50 text-green-600'
              : 'bg-gray-100 text-gray-600';
        return <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{row.actionLabel}</span>;
      },
    },
    {
      key: 'targetId',
      header: '对象',
      render: (row: AuditLogRow) => (
        <span className="text-xs text-gray-400 font-mono">{row.targetId ? row.targetId.slice(0, 10) : '-'}</span>
      ),
    },
    {
      key: 'enterpriseId',
      header: '企业',
      render: (row: AuditLogRow) => (
        <span className="text-xs text-gray-400 font-mono">{row.enterpriseId ? row.enterpriseId.slice(0, 8) : '平台'}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="审计日志" description="平台关键操作留痕,默认查询最近 7 天" />

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部模块</option>
          {MODULE_OPTIONS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="">全部动作</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
        />
        <span className="text-gray-400 text-sm">至</span>
        <input
          type="date"
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => load(1)}>
          刷新
        </Button>
      </div>

      <DataTable columns={columns} data={items} loading={loading} emptyText="暂无日志" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

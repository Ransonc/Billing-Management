'use client';

import { use } from 'react';
import { PondRecordsView, type FieldDef, type ColumnDef, type SummaryDef } from '@/components/fish-ponds/pond-records-view';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DrugsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fields: FieldDef[] = [
    { key: 'startDate', label: '开始日期', type: 'date', required: true },
    { key: 'endDate', label: '结束日期(与周期二选一)', type: 'date' },
    { key: 'drugName', label: '药品名称', type: 'text', required: true, placeholder: '如:聚维酮碘' },
    { key: 'periodDays', label: '周期天数(与结束日期二选一)', type: 'number' },
    { key: 'quantity', label: '用量', type: 'number', step: '0.1', required: true },
    { key: 'cost', label: '费用(元)', type: 'number', step: '0.01' },
    { key: 'reason', label: '用药目的/病症', type: 'text', colSpan: 2 },
    { key: 'notes', label: '备注', type: 'textarea', colSpan: 2 },
  ];

  const columns: ColumnDef[] = [
    { key: 'startDate', label: '开始', render: (r) => formatDate(r.startDate) },
    { key: 'endDate', label: '结束', render: (r) => (r.endDate ? formatDate(r.endDate) : '-') },
    { key: 'periodDays', label: '周期(天)', render: (r) => r.periodDays || '-' },
    { key: 'drugName', label: '药品' },
    { key: 'quantity', label: '用量', render: (r) => Number(r.quantity) },
    { key: 'cost', label: '费用', render: (r) => formatCurrency(r.cost) },
  ];

  const summaries: SummaryDef[] = [{ key: 'totalCost', label: '药品总费用', format: 'currency' }];

  return (
    <PondRecordsView
      pondId={id}
      title="用药管理"
      apiPath={`/api/fish-ponds/${id}/drugs`}
      fields={fields}
      columns={columns}
      summaries={summaries}
      successMsg="用药记录已保存"
    />
  );
}

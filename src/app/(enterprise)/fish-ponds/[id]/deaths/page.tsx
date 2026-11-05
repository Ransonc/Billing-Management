'use client';

import { use } from 'react';
import { PondRecordsView, type FieldDef, type ColumnDef, type SummaryDef } from '@/components/fish-ponds/pond-records-view';
import { formatDate } from '@/lib/utils';
import { DEATH_REASONS, DEATH_REASON_LABELS } from '@/lib/constants';

export default function DeathsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fields: FieldDef[] = [
    { key: 'deathDate', label: '日期', type: 'date', required: true },
    {
      key: 'reason',
      label: '死亡原因',
      type: 'select',
      options: Object.values(DEATH_REASONS).map((v) => ({ value: v, label: DEATH_REASON_LABELS[v] })),
    },
    { key: 'quantity', label: '死亡数量(尾)', type: 'number', required: true },
    { key: 'notes', label: '备注说明', type: 'textarea', colSpan: 2 },
  ];

  const columns: ColumnDef[] = [
    { key: 'deathDate', label: '日期', render: (r) => formatDate(r.deathDate) },
    { key: 'quantity', label: '死亡数量(尾)' },
    { key: 'reason', label: '原因', render: (r) => DEATH_REASON_LABELS[r.reason] || '-' },
    { key: 'notes', label: '备注', render: (r) => r.notes || '-' },
  ];

  const summaries: SummaryDef[] = [
    { key: 'totalStock', label: '累计投放(尾)', format: 'number' },
    { key: 'totalDeaths', label: '累计死亡(尾)', format: 'number' },
    { key: 'deathRate', label: '死亡率', format: 'percent' },
  ];

  return (
    <PondRecordsView
      pondId={id}
      title="每日损耗"
      apiPath={`/api/fish-ponds/${id}/deaths`}
      fields={fields}
      columns={columns}
      summaries={summaries}
      successMsg="损耗已记录"
    />
  );
}

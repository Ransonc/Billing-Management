'use client';

import { use } from 'react';
import { PondRecordsView, type FieldDef, type ColumnDef, type SummaryDef } from '@/components/fish-ponds/pond-records-view';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FeedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fields: FieldDef[] = [
    { key: 'feedDate', label: '投喂日期', type: 'date', required: true },
    { key: 'brand', label: '饲料品牌', type: 'text', required: true },
    { key: 'model', label: '型号', type: 'text' },
    { key: 'bags', label: '包数', type: 'number', required: true },
    { key: 'unitPrice', label: '单价(元/包)', type: 'number', step: '0.01' },
    { key: 'notes', label: '备注', type: 'textarea', colSpan: 2 },
  ];

  const columns: ColumnDef[] = [
    { key: 'feedDate', label: '日期', render: (r) => formatDate(r.feedDate) },
    { key: 'brand', label: '品牌' },
    { key: 'model', label: '型号', render: (r) => r.model || '-' },
    { key: 'bags', label: '包数' },
    { key: 'unitPrice', label: '单价', render: (r) => (r.unitPrice != null ? Number(r.unitPrice) : '-') },
    { key: 'totalCost', label: '总价', render: (r) => formatCurrency(r.totalCost) },
  ];

  const summaries: SummaryDef[] = [
    { key: 'totalCost', label: '饲料总花费', format: 'currency' },
  ];

  return (
    <PondRecordsView
      pondId={id}
      title="饲料管理"
      apiPath={`/api/fish-ponds/${id}/feed`}
      fields={fields}
      columns={columns}
      summaries={summaries}
      successMsg="饲料记录已保存"
    />
  );
}

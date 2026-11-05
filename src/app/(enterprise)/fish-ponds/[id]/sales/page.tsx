'use client';

import { use } from 'react';
import { PondRecordsView, type FieldDef, type ColumnDef, type SummaryDef } from '@/components/fish-ponds/pond-records-view';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function SalesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fields: FieldDef[] = [
    { key: 'saleDate', label: '出售日期', type: 'date', required: true },
    { key: 'fishSpecies', label: '品种', type: 'text', required: true },
    { key: 'quantity', label: '数量(尾)', type: 'number', required: true },
    { key: 'weight', label: '总重量(斤)', type: 'number', step: '0.1', required: true },
    { key: 'unitPrice', label: '单价(元/斤)', type: 'number', step: '0.01', required: true },
    { key: 'buyerName', label: '收购方', type: 'text' },
    { key: 'notes', label: '备注', type: 'textarea', colSpan: 2 },
  ];

  const columns: ColumnDef[] = [
    { key: 'saleDate', label: '日期', render: (r) => formatDate(r.saleDate) },
    { key: 'fishSpecies', label: '品种' },
    { key: 'quantity', label: '数量(尾)' },
    { key: 'weight', label: '重量(斤)', render: (r) => Number(r.weight) },
    { key: 'unitPrice', label: '单价', render: (r) => Number(r.unitPrice) },
    { key: 'totalAmount', label: '总金额', render: (r) => formatCurrency(r.totalAmount) },
    { key: 'buyerName', label: '收购方', render: (r) => r.buyerName || '-' },
  ];

  const summaries: SummaryDef[] = [
    { key: 'totalQuantity', label: '累计出售(尾)', format: 'number' },
    { key: 'totalWeight', label: '累计重量(斤)', format: 'number' },
    { key: 'totalAmount', label: '累计收入', format: 'currency' },
  ];

  return (
    <PondRecordsView
      pondId={id}
      title="分批出售"
      apiPath={`/api/fish-ponds/${id}/sales`}
      fields={fields}
      columns={columns}
      summaries={summaries}
      successMsg="出售记录已保存"
    />
  );
}

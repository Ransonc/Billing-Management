'use client';

import { use } from 'react';
import { PondRecordsView, type FieldDef, type ColumnDef, type SummaryDef } from '@/components/fish-ponds/pond-records-view';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function StockPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fields: FieldDef[] = [
    { key: 'fishSpecies', label: '鱼种', type: 'text', required: true, placeholder: '如:草鱼' },
    { key: 'stockDate', label: '投放日期', type: 'date', required: true },
    { key: 'quantity', label: '数量(尾)', type: 'number', required: true },
    { key: 'weight', label: '总重量(斤)', type: 'number', step: '0.1' },
    { key: 'unitPrice', label: '单价(元/斤或尾)', type: 'number', step: '0.01' },
    { key: 'notes', label: '备注', type: 'textarea', colSpan: 2 },
  ];

  const columns: ColumnDef[] = [
    { key: 'stockDate', label: '投放日期', render: (r) => formatDate(r.stockDate) },
    { key: 'fishSpecies', label: '鱼种' },
    { key: 'quantity', label: '数量(尾)' },
    { key: 'weight', label: '重量(斤)', render: (r) => (r.weight != null ? Number(r.weight) : '-') },
    { key: 'unitPrice', label: '单价', render: (r) => (r.unitPrice != null ? Number(r.unitPrice) : '-') },
    { key: 'totalCost', label: '总成本', render: (r) => formatCurrency(r.totalCost) },
  ];

  const summaries: SummaryDef[] = [
    { key: 'totalQuantity', label: '累计投放(尾)', format: 'number' },
    { key: 'totalCost', label: '投放总成本', format: 'currency' },
  ];

  return (
    <PondRecordsView
      pondId={id}
      title="鱼类投放"
      apiPath={`/api/fish-ponds/${id}/stock`}
      fields={fields}
      columns={columns}
      summaries={summaries}
      successMsg="投放记录已保存"
    />
  );
}

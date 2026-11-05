'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable, Pagination } from '@/components/ui/data-table';
import { useApi, api } from '@/hooks/use-api';
import { formatCurrency } from '@/lib/utils';
import type { DrugInventory, PaginatedResponse } from '@/types';

export default function DrugsPage() {
  const [drugs, setDrugs] = useState<DrugInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [onlyLow, setOnlyLow] = useState(false);
  const { call, loading } = useApi<PaginatedResponse<DrugInventory>>();
  const pageSize = 20;

  useEffect(() => {
    call(
      () =>
        api.get<PaginatedResponse<DrugInventory>>(
          `/api/drugs?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
            search
          )}&lowStock=${onlyLow ? '1' : ''}`
        ),
      { showError: false }
    ).then((data) => {
      if (data) {
        setDrugs(data.items);
        setTotal(data.total);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, onlyLow]);

  function stockCell(row: DrugInventory) {
    const low = row.stockQuantity <= row.safetyStock;
    return (
      <span className={low ? 'text-red-600 font-semibold' : 'text-gray-700'}>
        {row.stockQuantity} {row.unit}
        {low && <span className="ml-1 text-xs text-red-500">⚠ 预警</span>}
      </span>
    );
  }

  const columns = [
    {
      key: 'name',
      header: '药品名称',
      render: (row: DrugInventory) => (
        <Link href={`/drugs/${row.id}`} className="text-primary hover:underline">
          {row.name}
        </Link>
      ),
    },
    { key: 'specification', header: '规格', render: (row: DrugInventory) => row.specification || '-' },
    { key: 'unit', header: '单位' },
    { key: 'supplier', header: '供应商', render: (row: DrugInventory) => row.supplier || '-' },
    {
      key: 'purchasePrice',
      header: '成本价',
      render: (row: DrugInventory) =>
        row.purchasePrice != null ? formatCurrency(row.purchasePrice) : '-',
    },
    {
      key: 'salePrice',
      header: '销售价',
      render: (row: DrugInventory) => (row.salePrice != null ? formatCurrency(row.salePrice) : '-'),
    },
    { key: 'stockQuantity', header: '当前库存', render: stockCell },
    { key: 'safetyStock', header: '安全库存' },
  ];

  return (
    <div>
      <PageHeader
        title="药品库存"
        description="药品基础资料与库存预警"
        actions={
          <div className="flex gap-2">
            <Link href="/drugs/purchase">
              <Button variant="outline">采购入库</Button>
            </Link>
            <Link href="/drugs/new">
              <Button>+ 新增药品</Button>
            </Link>
          </div>
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
            placeholder="搜索药品名称 / 规格 / 供应商"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-72"
          />
          <Button type="submit" variant="outline">
            搜索
          </Button>
        </form>
        <Button variant={onlyLow ? 'default' : 'outline'} onClick={() => setOnlyLow((v) => !v)}>
          {onlyLow ? '✓ ' : ''}只看低库存
        </Button>
      </div>

      <DataTable columns={columns} data={drugs} loading={loading} emptyText="暂无药品" />
      <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

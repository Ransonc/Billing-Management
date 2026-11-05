'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApi, api } from '@/hooks/use-api';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  required?: boolean;
  step?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
}

export interface ColumnDef {
  key: string;
  label: string;
  // 台账记录为动态结构,各页面自行收窄字段类型
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: any) => React.ReactNode;
}

export interface SummaryDef {
  key: string;
  label: string;
  format?: 'currency' | 'number' | 'percent';
}

interface PondRecordsViewProps {
  pondId: string;
  title: string;
  apiPath: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  summaries?: SummaryDef[];
  successMsg?: string;
}

function formatSummary(value: unknown, format?: string) {
  const num = Number(value || 0);
  if (format === 'currency') return `¥${num.toFixed(2)}`;
  if (format === 'percent') return `${num}%`;
  return String(value ?? 0);
}

export function PondRecordsView({
  pondId,
  title,
  apiPath,
  fields,
  columns,
  summaries,
  successMsg = '记录成功',
}: PondRecordsViewProps) {
  const { call, loading } = useApi();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown>>({});
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    api
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .get<{ items: any[] } & Record<string, unknown>>(apiPath)
      .then((res) => {
        if (res.data) {
          const { items, ...rest } = res.data;
          setRecords(items || []);
          setSummary(rest);
        }
      })
      .catch(() => undefined);
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await call(() => api.post(apiPath, form), {
      showSuccess: true,
      successMsg,
    });
    if (result) {
      setForm({});
      load();
    }
  }

  return (
    <div>
      <Link href={`/fish-ponds/${pondId}`} className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回鱼塘详情
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">{title}</h1>

      {summaries && summaries.length > 0 && (
        <div
          className="grid gap-4 mb-4"
          style={{ gridTemplateColumns: `repeat(${summaries.length}, minmax(0, 1fr))` }}
        >
          {summaries.map((s) => (
            <div key={s.key} className="bg-white rounded-lg border p-4">
              <div className="text-xs text-gray-500">{s.label}</div>
              <div className="text-lg font-bold text-gray-800 mt-1">
                {formatSummary(summary[s.key], s.format)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>新增记录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <div
                  key={field.key}
                  className={`space-y-1.5 ${field.colSpan === 2 ? 'col-span-2' : ''}`}
                >
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && ' *'}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.key}
                      rows={2}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={form[field.key] || ''}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      id={field.key}
                      required={field.required}
                      className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm"
                      value={form[field.key] || ''}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    >
                      <option value="">请选择</option>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type}
                      step={field.step}
                      required={field.required}
                      placeholder={field.placeholder}
                      value={form[field.key] || ''}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '提交中...' : '保存记录'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>历史记录</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="py-10 text-center text-gray-400">暂无记录</div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    {columns.map((c) => (
                      <TableHead key={c.key} className="font-medium">
                        {c.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((row) => (
                    <TableRow key={row.id}>
                      {columns.map((c) => (
                        <TableCell key={c.key}>
                          {c.render ? c.render(row) : (row[c.key] ?? '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

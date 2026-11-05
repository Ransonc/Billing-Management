'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { useApi, api } from '@/hooks/use-api';
import * as XLSX from 'xlsx';

type ImportType = 'customers' | 'drugs' | 'sales' | 'debts';

interface PreviewRow {
  data: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}
interface PreviewResp {
  rows: PreviewRow[];
  total: number;
  validCount: number;
}
interface ConfirmResp {
  success: number;
  failed: number;
  errors: string[];
}

const TYPE_CONFIG: {
  key: ImportType;
  label: string;
  headers: string[];
  sample: Record<string, string | number>;
  hint: string;
}[] = [
  {
    key: 'customers',
    label: '客户档案',
    headers: ['名称', '电话', '地址', '联系人', '备注'],
    sample: { 名称: '张三水产', 电话: '13800000000', 地址: '湖州市南浔区', 联系人: '张三', 备注: '' },
    hint: '名称为必填。',
  },
  {
    key: 'drugs',
    label: '药品库存',
    headers: ['名称', '规格', '单位', '供应商', '采购价', '销售价', '库存数量', '安全库存'],
    sample: {
      名称: '聚维酮碘溶液',
      规格: '10% 500ml',
      单位: '瓶',
      供应商: 'XX动保',
      采购价: 12,
      销售价: 18,
      库存数量: 100,
      安全库存: 20,
    },
    hint: '名称为必填;单位留空默认为「瓶」。',
  },
  {
    key: 'sales',
    label: '历史销售',
    headers: ['客户名称', '药品名称', '数量', '单价', '销售日期', '备注'],
    sample: { 客户名称: '张三水产', 药品名称: '聚维酮碘溶液', 数量: 5, 单价: 18, 销售日期: '2026-06-01', 备注: '历史导入' },
    hint: '客户与药品必须已存在;历史销售只建档,不扣减库存。',
  },
  {
    key: 'debts',
    label: '历史欠款',
    headers: ['客户名称', '欠款金额', '欠款日期', '备注'],
    sample: { 客户名称: '张三水产', 欠款金额: 1500, 欠款日期: '2026-06-01', 备注: '上年度结余' },
    hint: '客户必须已存在;欠款日期留空默认今天。',
  },
];

export default function ImportPage() {
  const [type, setType] = useState<ImportType>('customers');
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [result, setResult] = useState<ConfirmResp | null>(null);
  const { call, loading } = useApi<PreviewResp | ConfirmResp>();

  const config = TYPE_CONFIG.find((t) => t.key === type)!;

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([config.sample], { header: config.headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.label);
    XLSX.writeFile(wb, `${config.label}导入模板.xlsx`);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    const data = await call(() => api.upload<PreviewResp>('/api/import', form), {
      successMsg: '',
    });
    if (data && 'rows' in data) setRows(data.rows);
    e.target.value = '';
  }

  async function handleConfirm() {
    if (!rows) return;
    const data = await call(() => api.post<ConfirmResp>('/api/import', { type, rows }), {
      showSuccess: true,
      successMsg: '导入完成',
    });
    if (data && 'success' in data) {
      setResult(data);
      setRows(null);
    }
  }

  const previewColumns =
    rows && rows[0]
      ? Object.keys(rows[0].data).filter((k) => !k.endsWith('Id'))
      : [];

  return (
    <div>
      <PageHeader title="Excel 批量导入" description="批量导入客户、药品库存、历史销售与欠款数据" />

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>第 1 步:选择数据类型并下载模板</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            {TYPE_CONFIG.map((t) => (
              <Button
                key={t.key}
                variant={type === t.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setType(t.key);
                  setRows(null);
                  setResult(null);
                }}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mb-3">{config.hint}</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            ⬇ 下载「{config.label}」模板
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardHeader>
          <CardTitle>第 2 步:上传填好的 Excel</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="block text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-white file:text-sm hover:file:bg-primary/90"
          />
        </CardContent>
      </Card>

      {rows && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>
              第 3 步:核对预览(共 {rows.length} 行,可导入 {rows.filter((r) => r.valid).length} 行)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 w-12">#</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500 w-16">状态</th>
                    {previewColumns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left text-xs text-gray-500 whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-left text-xs text-gray-500">问题</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r, i) => (
                    <tr key={i} className={r.valid ? 'border-t border-gray-100' : 'border-t border-red-100 bg-red-50/40'}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">
                        {r.valid ? (
                          <span className="text-green-600 text-xs">正常</span>
                        ) : (
                          <span className="text-red-500 text-xs">跳过</span>
                        )}
                      </td>
                      {previewColumns.map((c) => (
                        <td key={c} className="px-3 py-2 whitespace-nowrap text-gray-700">
                          {r.data[c] != null && r.data[c] !== '' ? String(r.data[c]) : '-'}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-xs text-red-500">{r.errors.join(';')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && <div className="text-xs text-gray-400 mt-2">仅预览前 100 行,全部有效数据将一起导入。</div>}
            <div className="mt-4">
              <Button onClick={handleConfirm} disabled={loading || rows.every((r) => !r.valid)}>
                {loading ? '导入中...' : `确认导入 ${rows.filter((r) => r.valid).length} 行`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>导入结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="text-green-600">成功导入 {result.success} 条</div>
              {result.failed > 0 && <div className="text-red-500">跳过 {result.failed} 条无效数据</div>}
              {result.errors.length > 0 && (
                <ul className="text-xs text-gray-500 mt-2 space-y-1 max-h-40 overflow-auto">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

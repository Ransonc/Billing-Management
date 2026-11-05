import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';

type ImportType = 'customers' | 'drugs' | 'sales' | 'debts';

interface PreviewRow {
  data: Record<string, unknown>;
  valid: boolean;
  errors: string[];
}

// 中文表头 → 字段
const HEADER_MAP: Record<ImportType, Record<string, string>> = {
  customers: {
    名称: 'name',
    姓名: 'name',
    电话: 'phone',
    地址: 'address',
    联系人: 'contactPerson',
    备注: 'notes',
  },
  drugs: {
    名称: 'name',
    药品名称: 'name',
    规格: 'specification',
    单位: 'unit',
    供应商: 'supplier',
    采购价: 'purchasePrice',
    销售价: 'salePrice',
    库存数量: 'stockQuantity',
    安全库存: 'safetyStock',
  },
  sales: {
    客户名称: 'customerName',
    药品名称: 'drugName',
    数量: 'quantity',
    单价: 'unitPrice',
    销售日期: 'saleDate',
    日期: 'saleDate',
    备注: 'notes',
  },
  debts: {
    客户名称: 'customerName',
    欠款金额: 'totalAmount',
    金额: 'totalAmount',
    欠款日期: 'createdAt',
    日期: 'createdAt',
    备注: 'notes',
  },
};

function toText(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Excel 日期序列号 / 字符串 → YYYY-MM-DD
function toDateStr(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') {
    // Excel 日期序列号(1900 系统,带 1900 闰年 bug 的 25569 偏移)
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(v).trim().replace(/[./年月]/g, '-').replace(/日/g, '');
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

async function parseAndPreview(
  type: ImportType,
  buffer: Buffer,
  enterpriseId: string
): Promise<PreviewRow[]> {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
  if (raw.length < 2) return [];

  const headerCells = (raw[0] as unknown[]).map((h) => toText(h));
  const map = HEADER_MAP[type];
  const colFields = headerCells.map((h) => map[h] || null);

  // 引用数据:客户/药品名称 → id
  const [customers, drugs] = await Promise.all([
    type === 'sales' || type === 'debts'
      ? prisma.customer.findMany({ where: { enterpriseId }, select: { id: true, name: true } })
      : Promise.resolve([]),
    type === 'sales'
      ? prisma.drugInventory.findMany({ where: { enterpriseId }, select: { id: true, name: true } })
      : Promise.resolve([]),
  ]);
  const customerMap = new Map(customers.map((c) => [c.name.trim(), c.id]));
  const drugMap = new Map(drugs.map((d) => [d.name.trim(), d.id]));

  const rows: PreviewRow[] = [];
  for (let i = 1; i < raw.length; i++) {
    const line = raw[i] as unknown[];
    if (!line.some((c) => toText(c) !== '')) continue;
    const data: Record<string, unknown> = {};
    colFields.forEach((field, idx) => {
      if (field) data[field] = line[idx];
    });

    const errors: string[] = [];
    const out: Record<string, unknown> = {};

    if (type === 'customers') {
      out.name = toText(data.name);
      if (!out.name) errors.push('名称不能为空');
      out.phone = toText(data.phone) || null;
      out.address = toText(data.address) || null;
      out.contactPerson = toText(data.contactPerson) || null;
      out.notes = toText(data.notes) || null;
    } else if (type === 'drugs') {
      out.name = toText(data.name);
      if (!out.name) errors.push('药品名称不能为空');
      out.specification = toText(data.specification) || null;
      out.unit = toText(data.unit) || '瓶';
      out.supplier = toText(data.supplier) || null;
      out.purchasePrice = toNumber(data.purchasePrice);
      out.salePrice = toNumber(data.salePrice);
      out.stockQuantity = toNumber(data.stockQuantity) ?? 0;
      out.safetyStock = toNumber(data.safetyStock) ?? 0;
    } else if (type === 'sales') {
      const cName = toText(data.customerName);
      const dName = toText(data.drugName);
      out.customerName = cName;
      out.drugName = dName;
      out.customerId = cName ? customerMap.get(cName) || null : null;
      out.drugId = dName ? drugMap.get(dName) || null : null;
      if (!cName) errors.push('客户名称不能为空');
      else if (!out.customerId) errors.push(`客户「${cName}」不存在,请先导入客户`);
      if (!dName) errors.push('药品名称不能为空');
      else if (!out.drugId) errors.push(`药品「${dName}」不存在,请先导入药品`);
      const quantity = toNumber(data.quantity);
      out.quantity = quantity;
      if (quantity == null || quantity <= 0) errors.push('数量必须大于0');
      const unitPrice = toNumber(data.unitPrice);
      out.unitPrice = unitPrice;
      if (unitPrice == null || unitPrice < 0) errors.push('单价不合法');
      const saleDate = toDateStr(data.saleDate);
      out.saleDate = saleDate;
      if (!saleDate) errors.push('销售日期不合法');
      out.notes = toText(data.notes) || null;
    } else {
      const cName = toText(data.customerName);
      out.customerName = cName;
      out.customerId = cName ? customerMap.get(cName) || null : null;
      if (!cName) errors.push('客户名称不能为空');
      else if (!out.customerId) errors.push(`客户「${cName}」不存在,请先导入客户`);
      const totalAmount = toNumber(data.totalAmount);
      out.totalAmount = totalAmount;
      if (totalAmount == null || totalAmount <= 0) errors.push('欠款金额必须大于0');
      out.createdAt = toDateStr(data.createdAt) || new Date().toISOString().slice(0, 10);
      out.notes = toText(data.notes) || null;
    }

    rows.push({ data: out, valid: errors.length === 0, errors });
  }
  return rows;
}

async function confirmImport(
  type: ImportType,
  rows: PreviewRow[],
  enterpriseId: string,
  userId: string
): Promise<{ success: number; failed: number; errors: string[] }> {
  const validRows = rows.filter((r) => r.valid);
  const errors = rows.filter((r) => !r.valid).map((r, i) => `第${i + 1}行: ${r.errors.join(';')}`);
  let success = 0;

  if (type === 'customers') {
    await prisma.customer.createMany({
      data: validRows.map((r) => ({
        enterpriseId,
        name: r.data.name as string,
        phone: r.data.phone as string | null,
        address: r.data.address as string | null,
        contactPerson: r.data.contactPerson as string | null,
        notes: r.data.notes as string | null,
        createdById: userId,
      })),
    });
    success = validRows.length;
  } else if (type === 'drugs') {
    await prisma.drugInventory.createMany({
      data: validRows.map((r) => ({
        enterpriseId,
        name: r.data.name as string,
        specification: r.data.specification as string | null,
        unit: r.data.unit as string,
        supplier: r.data.supplier as string | null,
        purchasePrice: r.data.purchasePrice as number | null,
        salePrice: r.data.salePrice as number | null,
        stockQuantity: r.data.stockQuantity as number,
        safetyStock: r.data.safetyStock as number,
      })),
    });
    success = validRows.length;
  } else if (type === 'sales') {
    // 历史销售仅建档,不联动库存与欠款
    await prisma.drugSale.createMany({
      data: validRows.map((r) => {
        const quantity = r.data.quantity as number;
        const unitPrice = r.data.unitPrice as number;
        return {
          enterpriseId,
          drugId: r.data.drugId as string,
          customerId: r.data.customerId as string | null,
          quantity,
          unitPrice,
          totalAmount: Number((quantity * unitPrice).toFixed(2)),
          paidAmount: 0,
          debtAmount: Number((quantity * unitPrice).toFixed(2)),
          paymentStatus: 'unpaid',
          saleDate: new Date(r.data.saleDate as string),
          operatorId: userId,
          notes: r.data.notes as string | null,
        };
      }),
    });
    success = validRows.length;
  } else {
    await prisma.debt.createMany({
      data: validRows.map((r) => ({
        enterpriseId,
        customerId: r.data.customerId as string,
        totalAmount: r.data.totalAmount as number,
        paidAmount: 0,
        remainingAmount: r.data.totalAmount as number,
        status: 'pending',
        createdAt: new Date(r.data.createdAt as string),
      })),
    });
    success = validRows.length;
  }

  return { success, failed: rows.length - success, errors };
}

export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    if (!ctx.enterpriseId) return errorResponse('当前账号无所属企业', 403);
    buildEnterpriseWhere(ctx); // 超管无企业时抛错

    const contentType = request.headers.get('content-type') || '';

    // 第一步:上传文件 → 解析预览
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const type = (form.get('type') as ImportType) || '';
      if (!['customers', 'drugs', 'sales', 'debts'].includes(type)) {
        return errorResponse('导入类型非法');
      }
      const file = form.get('file') as File | null;
      if (!file || file.size === 0) return errorResponse('请选择要导入的 Excel 文件');

      const buffer = Buffer.from(await file.arrayBuffer());
      const rows = await parseAndPreview(type, buffer, ctx.enterpriseId);
      if (rows.length === 0) return errorResponse('未解析到有效数据行,请检查表头与内容');
      return jsonResponse({ rows, total: rows.length, validCount: rows.filter((r) => r.valid).length });
    }

    // 第二步:确认入库
    const body = await request.json();
    const type = body.type as ImportType;
    const rows = body.rows as PreviewRow[];
    if (!['customers', 'drugs', 'sales', 'debts'].includes(type) || !Array.isArray(rows)) {
      return errorResponse('导入参数非法');
    }

    const result = await confirmImport(type, rows, ctx.enterpriseId, ctx.userId);
    await createAuditLog({
      ctx,
      action: 'import',
      module: type,
      newValue: { type, success: result.success, failed: result.failed },
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '导入失败', 500);
  }
}

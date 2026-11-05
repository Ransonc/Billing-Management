import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { calculateDrugSaleTotal } from '@/server/calculations';

// 出售记录列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const pond = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, pond?.enterpriseId);

    const items = await prisma.saleRecord.findMany({
      where: { fishPondId: id },
      orderBy: { saleDate: 'desc' },
    });
    const totalAmount = items.reduce((s, r) => s + Number(r.totalAmount || 0), 0);
    const totalQuantity = items.reduce((s, r) => s + r.quantity, 0);
    const totalWeight = items.reduce((s, r) => s + Number(r.weight || 0), 0);
    return jsonResponse({ items, totalAmount, totalQuantity, totalWeight });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取出售记录失败', 500);
  }
}

// 新增分批出售(金额 = 重量 × 单价)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const pond = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, pond?.enterpriseId);

    const body = await request.json();
    if (!body.fishSpecies || !body.quantity || body.weight == null || body.unitPrice == null || !body.saleDate) {
      return errorResponse('品种、数量、重量、单价、日期不能为空');
    }

    const weight = Number(body.weight);
    const unitPrice = Number(body.unitPrice);
    const record = await prisma.saleRecord.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: id,
        fishSpecies: body.fishSpecies,
        quantity: Number(body.quantity),
        weight,
        unitPrice,
        totalAmount: calculateDrugSaleTotal(weight, unitPrice),
        saleDate: new Date(body.saleDate),
        buyerName: body.buyerName || null,
        notes: body.notes || null,
      },
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '新增出售记录失败', 500);
  }
}

import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const drug = await prisma.drugInventory.findFirst({
      where: { id, enterpriseId: ctx.enterpriseId! },
      include: {
        purchaseRecords: { orderBy: { purchaseDate: 'desc' }, take: 20 },
        saleRecords: { orderBy: { saleDate: 'desc' }, take: 20 },
      },
    });
    if (!drug) return errorResponse('药品不存在', 404);
    return jsonResponse(drug);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取药品失败', 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.drugInventory.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const body = await request.json();
    const drug = await prisma.drugInventory.update({
      where: { id },
      data: {
        name: body.name,
        specification: body.specification,
        unit: body.unit,
        supplier: body.supplier,
        purchasePrice: body.purchasePrice === '' || body.purchasePrice == null ? null : Number(body.purchasePrice),
        salePrice: body.salePrice === '' || body.salePrice == null ? null : Number(body.salePrice),
        safetyStock: body.safetyStock == null ? undefined : Number(body.safetyStock),
        status: body.status,
      },
    });

    await createAuditLog({ ctx, action: 'update', module: 'drug', targetId: id });
    return jsonResponse(drug);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新药品失败', 500);
  }
}

// 软删除(停用),避免级联抹掉进销存历史
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.drugInventory.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    await prisma.drugInventory.update({ where: { id }, data: { status: 'inactive' } });
    await createAuditLog({ ctx, action: 'delete', module: 'drug', targetId: id });
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '删除药品失败', 500);
  }
}

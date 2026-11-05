import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 鱼塘详情:含全部养殖台账(时间线数据)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const pond = await prisma.fishPond.findFirst({
      where: { id, ...buildEnterpriseWhere(ctx) },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        fishStockings: { orderBy: { stockDate: 'desc' } },
        dailyDeaths: { orderBy: { deathDate: 'desc' } },
        feedRecords: { orderBy: { feedDate: 'desc' } },
        drugRecords: { orderBy: { startDate: 'desc' } },
        saleRecords: { orderBy: { saleDate: 'desc' } },
        waterQualities: { orderBy: { recordDate: 'desc' }, take: 50 },
      },
    });

    if (!pond) return errorResponse('鱼塘不存在', 404);
    return jsonResponse(pond);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取鱼塘详情失败', 500);
  }
}

// 更新鱼塘
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const existing = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const body = await request.json();
    const pond = await prisma.fishPond.update({
      where: { id },
      data: {
        customerId: body.customerId === undefined ? undefined : body.customerId || null,
        name: body.name,
        area: body.area === '' || body.area == null ? null : Number(body.area),
        waterDepth: body.waterDepth === '' || body.waterDepth == null ? null : Number(body.waterDepth),
        fishSpecies: body.fishSpecies,
        stockDate: body.stockDate ? new Date(body.stockDate) : null,
        stockQuantity: body.stockQuantity ? Number(body.stockQuantity) : null,
        stockWeight: body.stockWeight === '' || body.stockWeight == null ? null : Number(body.stockWeight),
        status: body.status,
        notes: body.notes,
      },
    });

    await createAuditLog({ ctx, action: 'update', module: 'fish_pond', targetId: id });
    return jsonResponse(pond);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新鱼塘失败', 500);
  }
}

// 停用鱼塘
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const existing = await prisma.fishPond.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    await prisma.fishPond.update({ where: { id }, data: { status: 'inactive' } });
    await createAuditLog({ ctx, action: 'delete', module: 'fish_pond', targetId: id });
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '删除鱼塘失败', 500);
  }
}

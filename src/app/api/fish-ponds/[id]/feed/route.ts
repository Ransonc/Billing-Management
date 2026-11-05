import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 饲料记录列表
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

    const items = await prisma.feedRecord.findMany({
      where: { fishPondId: id },
      orderBy: { feedDate: 'desc' },
    });
    const totalCost = items.reduce((s, r) => s + Number(r.totalCost || 0), 0);
    return jsonResponse({ items, totalCost });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取饲料记录失败', 500);
  }
}

// 新增饲料记录(总价 = 包数 × 单价)
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
    if (!body.brand || !body.bags || !body.feedDate) {
      return errorResponse('品牌、包数、日期不能为空');
    }

    const bags = Number(body.bags);
    const unitPrice = body.unitPrice ? Number(body.unitPrice) : null;
    const record = await prisma.feedRecord.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: id,
        brand: body.brand,
        model: body.model || null,
        bags,
        unitPrice,
        totalCost: unitPrice != null ? Number((bags * unitPrice).toFixed(2)) : null,
        feedDate: new Date(body.feedDate),
        notes: body.notes || null,
      },
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '新增饲料记录失败', 500);
  }
}

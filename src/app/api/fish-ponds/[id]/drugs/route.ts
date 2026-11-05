import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 用药记录列表
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

    const items = await prisma.drugRecord.findMany({
      where: { fishPondId: id },
      orderBy: { startDate: 'desc' },
    });
    const totalCost = items.reduce((s, r) => s + Number(r.cost || 0), 0);
    return jsonResponse({ items, totalCost });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取用药记录失败', 500);
  }
}

// 新增用药记录(支持周期:开始/结束日期或周期天数)
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
    if (!body.drugName || body.quantity == null || !body.startDate) {
      return errorResponse('药品名称、用量、开始日期不能为空');
    }

    const startDate = new Date(body.startDate);
    let endDate = body.endDate ? new Date(body.endDate) : null;
    let periodDays = body.periodDays ? Number(body.periodDays) : null;
    if (!endDate && periodDays) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + periodDays - 1);
    }
    if (endDate && !periodDays) {
      periodDays =
        Math.round((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1;
    }

    const record = await prisma.drugRecord.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: id,
        drugName: body.drugName,
        drugId: body.drugId || null,
        quantity: Number(body.quantity),
        cost: body.cost ? Number(body.cost) : null,
        startDate,
        endDate,
        periodDays,
        reason: body.reason || null,
        operatorId: ctx.userId,
        notes: body.notes || null,
      },
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '新增用药记录失败', 500);
  }
}

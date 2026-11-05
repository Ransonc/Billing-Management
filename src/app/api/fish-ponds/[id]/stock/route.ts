import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import type { AuthContext } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

async function assertPond(ctx: AuthContext, pondId: string) {
  const pond = await prisma.fishPond.findUnique({
    where: { id: pondId },
    select: { enterpriseId: true },
  });
  assertEnterpriseAccess(ctx, pond?.enterpriseId);
  return pond;
}

// 投放记录列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    await assertPond(ctx, id);
    const items = await prisma.fishStocking.findMany({
      where: { fishPondId: id },
      orderBy: { stockDate: 'desc' },
    });
    const totalCost = items.reduce((s, r) => s + Number(r.totalCost || 0), 0);
    const totalQuantity = items.reduce((s, r) => s + r.quantity, 0);
    return jsonResponse({ items, totalCost, totalQuantity });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取投放记录失败', 500);
  }
}

// 新增投放(自动计算投放成本:优先 重量×单价,否则 数量×单价)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    await assertPond(ctx, id);
    const body = await request.json();

    if (!body.fishSpecies || !body.quantity || !body.stockDate) {
      return errorResponse('品种、数量、投放日期不能为空');
    }

    const quantity = Number(body.quantity);
    const weight = body.weight ? Number(body.weight) : null;
    const unitPrice = body.unitPrice ? Number(body.unitPrice) : null;
    const totalCost =
      unitPrice != null ? Number(((weight ?? quantity) * unitPrice).toFixed(2)) : null;

    const record = await prisma.fishStocking.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: id,
        fishSpecies: body.fishSpecies,
        quantity,
        weight,
        unitPrice,
        totalCost,
        stockDate: new Date(body.stockDate),
        notes: body.notes || null,
      },
    });

    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '新增投放记录失败', 500);
  }
}

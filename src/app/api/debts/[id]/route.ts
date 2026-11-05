import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 欠款详情(含回款明细)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const debt = await prisma.debt.findFirst({
      where: { id, ...(ctx.enterpriseId ? { enterpriseId: ctx.enterpriseId } : {}) },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });
    if (!debt) return errorResponse('欠款单不存在', 404);
    return jsonResponse(debt);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取欠款详情失败', 500);
  }
}

// 保存电子签名
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.debt.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const body = await request.json();
    if (!body.signImageUrl) return errorResponse('签名数据不能为空');

    const debt = await prisma.debt.update({
      where: { id },
      data: { signImageUrl: body.signImageUrl, signDate: new Date() },
    });

    await createAuditLog({ ctx, action: 'update', module: 'debt', targetId: id });
    return jsonResponse(debt);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '保存签名失败', 500);
  }
}

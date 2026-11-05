import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.financeRecord.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const body = await request.json();
    const record = await prisma.financeRecord.update({
      where: { id },
      data: {
        type: body.type,
        category: body.category,
        amount: body.amount != null ? Number(body.amount) : undefined,
        description: body.description,
        recordDate: body.recordDate ? new Date(body.recordDate) : undefined,
      },
    });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新失败', 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.financeRecord.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    // 业务自动生成的销售实收记录不允许删除
    if (existing && (existing as { relatedType?: string | null }).relatedType === 'drug_sale') {
      return errorResponse('销售自动生成的收入记录不可删除');
    }

    await prisma.financeRecord.delete({ where: { id } });
    await createAuditLog({ ctx, action: 'delete', module: 'finance', targetId: id });
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '删除失败', 500);
  }
}

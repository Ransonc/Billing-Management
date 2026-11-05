import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 结束拜访:填写结果/跟进事项/下次跟进时间
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customerVisit.findUnique({
      where: { id },
      select: { enterpriseId: true, userId: true },
    });
    if (!existing) return errorResponse('拜访记录不存在', 404);
    assertEnterpriseAccess(ctx, existing.enterpriseId);

    const body = await request.json();
    const visit = await prisma.customerVisit.update({
      where: { id },
      data: {
        endTime: new Date(),
        result: body.result || null,
        followUp: body.followUp || null,
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
      },
    });
    return jsonResponse(visit);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '结束拜访失败', 500);
  }
}

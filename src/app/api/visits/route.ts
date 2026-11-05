import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';

// 客户拜访列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const today = searchParams.get('today') === '1';
    const isManager = ctx.role === ROLES.SUPER_ADMIN || ctx.role === ROLES.OWNER;

    const where: Record<string, unknown> = {
      ...buildEnterpriseWhere(ctx),
      ...(isManager ? {} : { userId: ctx.userId }),
    };
    if (customerId) where.customerId = customerId;
    if (today) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.startTime = { gte: start };
    }

    const visits = await prisma.customerVisit.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: 200,
      include: { customer: { select: { id: true, name: true } } },
    });

    const userIds = [...new Set(visits.map((v) => v.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    return jsonResponse({
      items: visits.map((v) => ({ ...v, userName: nameMap.get(v.userId) || v.userId })),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取拜访记录失败', 500);
  }
}

// 开始客户拜访
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.customerId || !body.purpose) {
      return errorResponse('客户和拜访目的不能为空');
    }
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, customer?.enterpriseId);

    const visit = await prisma.customerVisit.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        userId: ctx.userId,
        customerId: body.customerId,
        purpose: body.purpose,
        latitude: body.lat != null ? Number(body.lat) : null,
        longitude: body.lng != null ? Number(body.lng) : null,
        startTime: new Date(),
      },
    });
    return jsonResponse(visit);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '开始拜访失败', 500);
  }
}

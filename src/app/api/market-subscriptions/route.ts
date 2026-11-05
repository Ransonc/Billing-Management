import { prisma } from '@/lib/db/prisma';
import { requireAuth, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { z } from 'zod';

const PLAN_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const createSchema = z.object({
  plan: z.enum(['monthly', 'quarterly', 'yearly']),
});

// 行情订阅状态
export async function GET() {
  try {
    const ctx = await requireAuth();
    const subscription = await prisma.marketSubscription.findUnique({
      where: { userId: ctx.userId },
    });
    // 是否已过期
    const active = !!subscription && subscription.status === 'active' && subscription.endDate >= new Date();
    return jsonResponse({ subscription, active });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '订阅状态加载失败', 500);
  }
}

// 开通/续费订阅(支付流程暂未接入,直接生效)
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const { plan } = createSchema.parse(body);

    const now = new Date();
    const existing = await prisma.marketSubscription.findUnique({
      where: { userId: ctx.userId },
    });

    // 未过期续费时从到期日顺延
    const base = existing && existing.endDate >= now ? existing.endDate : now;
    const endDate = new Date(base);
    endDate.setMonth(endDate.getMonth() + PLAN_MONTHS[plan]);

    const subscription = await prisma.marketSubscription.upsert({
      where: { userId: ctx.userId },
      update: { plan, startDate: now, endDate, status: 'active', enterpriseId: ctx.enterpriseId },
      create: {
        userId: ctx.userId,
        enterpriseId: ctx.enterpriseId,
        plan,
        startDate: now,
        endDate,
        status: 'active',
      },
    });

    await createAuditLog({
      ctx,
      action: 'subscribe',
      module: 'market_price',
      targetId: subscription.id,
      newValue: { plan },
    });

    return jsonResponse({ subscription, active: true });
  } catch (err) {
    if (err instanceof z.ZodError) return errorResponse('套餐参数非法');
    return errorResponse(err instanceof Error ? err.message : '订阅失败', 500);
  }
}

import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';

// 外勤轨迹列表(含当前进行中的外勤)
export async function GET(_request: Request) {
  try {
    const ctx = await requireAuth();
    const isManager = ctx.role === ROLES.SUPER_ADMIN || ctx.role === ROLES.OWNER;
    const where: Record<string, unknown> = {
      ...buildEnterpriseWhere(ctx),
      ...(isManager ? {} : { userId: ctx.userId }),
    };

    const [tracks, users] = await Promise.all([
      prisma.fieldTrack.findMany({
        where,
        orderBy: { startTime: 'desc' },
        take: 100,
        include: { _count: { select: { fieldTrackPoints: true } } },
      }),
      prisma.user.findMany({
        where: { enterpriseId: ctx.enterpriseId!, role: ROLES.EMPLOYEE },
        select: { id: true, name: true },
      }),
    ]);
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    const activeTrack = tracks.find((t) => t.status === 'active' && t.userId === ctx.userId) || null;

    return jsonResponse({
      activeTrack,
      items: tracks.map((t) => ({ ...t, userName: nameMap.get(t.userId) || t.userId })),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取外勤记录失败', 500);
  }
}

// 开始/结束外勤
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const action = body.action as 'start' | 'end';

    if (action === 'start') {
      const active = await prisma.fieldTrack.findFirst({
        where: { userId: ctx.userId, status: 'active' },
      });
      if (active) return errorResponse('已有进行中的外勤,请先结束');

      const track = await prisma.fieldTrack.create({
        data: {
          enterpriseId: ctx.enterpriseId!,
          userId: ctx.userId,
          startTime: new Date(),
          status: 'active',
        },
      });
      return jsonResponse(track);
    }

    // 结束外勤
    const track = await prisma.fieldTrack.findFirst({
      where: { userId: ctx.userId, status: 'active' },
    });
    if (!track) return errorResponse('没有进行中的外勤');

    const endTime = new Date();
    const duration = Math.max(1, Math.round((endTime.getTime() - track.startTime.getTime()) / 60000));
    const updated = await prisma.fieldTrack.update({
      where: { id: track.id },
      data: { endTime, duration, status: 'ended' },
    });
    return jsonResponse(updated);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '外勤操作失败', 500);
  }
}

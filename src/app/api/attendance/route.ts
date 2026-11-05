import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';

// 考勤记录(老板可看全企业,员工只看自己)
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const today = searchParams.get('today') === '1';
    const month = searchParams.get('month'); // 2026-10
    const isManager = ctx.role === ROLES.SUPER_ADMIN || ctx.role === ROLES.OWNER;
    const userId = isManager ? searchParams.get('userId') || undefined : ctx.userId;

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (userId) where.userId = userId;
    if (today) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      where.date = { gte: start, lte: end };
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
    }

    // 附带员工姓名映射
    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      take: today ? 10 : 200,
    });

    const userIds = [...new Set(records.map((r) => r.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(users.map((u) => [u.id, u.name]));

    return jsonResponse({
      items: records.map((r) => ({ ...r, userName: nameMap.get(r.userId) || r.userId })),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取考勤失败', 500);
  }
}

// 上班/下班打卡
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();
    const action = body.action as 'checkin' | 'checkout';
    if (action !== 'checkin' && action !== 'checkout') {
      return errorResponse('无效的打卡动作');
    }

    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const existing = await prisma.attendance.findFirst({
      where: { userId: ctx.userId, date: { gte: dayStart, lte: dayEnd } },
    });

    const location = {
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
      addr: body.addr || null,
    };

    if (action === 'checkin') {
      if (existing) return errorResponse('今天已打过上班卡');
      // 9:00 之后算迟到
      const late = now.getHours() >= 9;
      const record = await prisma.attendance.create({
        data: {
          enterpriseId: ctx.enterpriseId!,
          userId: ctx.userId,
          checkInTime: now,
          checkInLat: location.lat,
          checkInLng: location.lng,
          checkInAddr: location.addr,
          status: late ? 'late' : 'normal',
          date: now,
        },
      });
      return jsonResponse({ record, status: late ? 'late' : 'normal' });
    }

    // 下班打卡
    if (!existing) return errorResponse('请先打上班卡');
    if (existing.checkOutTime) return errorResponse('今天已打过下班卡');

    // 18:00 前下班算早退(迟到记录优先保留 late)
    const early = now.getHours() < 18;
    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOutTime: now,
        checkOutLat: location.lat,
        checkOutLng: location.lng,
        checkOutAddr: location.addr,
        status: existing.status === 'late' ? 'late' : early ? 'early' : 'normal',
      },
    });
    return jsonResponse({ record });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '打卡失败', 500);
  }
}

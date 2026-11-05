import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 上报外勤 GPS 轨迹点
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.fieldTrackId || body.lat == null || body.lng == null) {
      return errorResponse('外勤ID和经纬度不能为空');
    }

    const track = await prisma.fieldTrack.findFirst({
      where: { id: body.fieldTrackId, userId: ctx.userId, status: 'active' },
    });
    if (!track) return errorResponse('外勤不存在或已结束', 404);

    const point = await prisma.fieldTrackPoint.create({
      data: {
        fieldTrackId: track.id,
        latitude: Number(body.lat),
        longitude: Number(body.lng),
        accuracy: body.accuracy != null ? Number(body.accuracy) : null,
        timestamp: new Date(),
      },
    });
    return jsonResponse(point);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '轨迹点上报失败', 500);
  }
}

// 查询某次外勤的轨迹点
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const fieldTrackId = searchParams.get('fieldTrackId');
    if (!fieldTrackId) return errorResponse('缺少外勤ID');

    const track = await prisma.fieldTrack.findFirst({
      where: { id: fieldTrackId, ...(ctx.enterpriseId ? { enterpriseId: ctx.enterpriseId } : {}) },
    });
    if (!track) return errorResponse('外勤不存在', 404);

    const points = await prisma.fieldTrackPoint.findMany({
      where: { fieldTrackId },
      orderBy: { timestamp: 'asc' },
    });
    return jsonResponse(points);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取轨迹点失败', 500);
  }
}

import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { checkWaterQuality } from '@/server/calculations';
import { DEFAULT_WATER_THRESHOLDS, WATER_QUALITY_INDICATOR_LABELS } from '@/lib/constants';

// 字段名(DB) -> 指标 key(阈值表)
const FIELD_TO_INDICATOR: Record<string, string> = {
  temperature: 'temperature',
  ph: 'ph',
  dissolvedOxygen: 'dissolved_oxygen',
  ammonia: 'ammonia',
  nitrite: 'nitrite',
};

// 水质记录列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const fishPondId = searchParams.get('fishPondId');
    const days = Number(searchParams.get('days')) || 0;
    const abnormalOnly = searchParams.get('abnormal') === '1';
    const limit = Number(searchParams.get('limit')) || 200;

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (fishPondId) where.fishPondId = fishPondId;
    if (abnormalOnly) where.abnormal = true;
    if (days > 0) {
      where.recordDate = { gte: new Date(Date.now() - days * 24 * 3600 * 1000) };
    }

    const items = await prisma.waterQualityRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
      take: limit,
      include: { fishPond: { select: { id: true, name: true } } },
    });

    return jsonResponse({ items });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取水质记录失败', 500);
  }
}

// 录入水质数据:按阈值自动标记正常/异常
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.recordDate) return errorResponse('检测日期不能为空');
    if (body.fishPondId) {
      const pond = await prisma.fishPond.findUnique({
        where: { id: body.fishPondId },
        select: { enterpriseId: true },
      });
      assertEnterpriseAccess(ctx, pond?.enterpriseId);
    }

    // 读取平台阈值配置,缺失则用默认值
    const thresholds = await prisma.waterQualityThreshold.findMany();
    const thresholdMap = new Map(thresholds.map((t) => [t.indicator, t]));

    const details: string[] = [];
    let abnormal = false;

    for (const [field, indicator] of Object.entries(FIELD_TO_INDICATOR)) {
      if (body[field] === '' || body[field] == null) continue;
      const value = Number(body[field]);
      if (isNaN(value)) continue;

      const configured = thresholdMap.get(indicator);
      const fallback = DEFAULT_WATER_THRESHOLDS[indicator];
      const threshold = configured
        ? {
            minValue: Number(configured.minValue),
            maxValue: Number(configured.maxValue),
            warningMin: configured.warningMin != null ? Number(configured.warningMin) : undefined,
            warningMax: configured.warningMax != null ? Number(configured.warningMax) : undefined,
          }
        : { minValue: fallback.min, maxValue: fallback.max };

      const result = checkWaterQuality(WATER_QUALITY_INDICATOR_LABELS[indicator] || indicator, value, threshold);
      if (result.isAbnormal) {
        abnormal = true;
        details.push(result.message);
      }
    }

    const record = await prisma.waterQualityRecord.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        fishPondId: body.fishPondId || null,
        recordDate: new Date(body.recordDate),
        temperature: body.temperature === '' || body.temperature == null ? null : Number(body.temperature),
        ph: body.ph === '' || body.ph == null ? null : Number(body.ph),
        dissolvedOxygen:
          body.dissolvedOxygen === '' || body.dissolvedOxygen == null ? null : Number(body.dissolvedOxygen),
        ammonia: body.ammonia === '' || body.ammonia == null ? null : Number(body.ammonia),
        nitrite: body.nitrite === '' || body.nitrite == null ? null : Number(body.nitrite),
        source: body.source || 'manual',
        abnormal,
        abnormalDetails: details.length > 0 ? details.join(';') : null,
        operatorId: ctx.userId,
      },
    });

    await createAuditLog({ ctx, action: 'create', module: 'water_quality', targetId: record.id });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '录入水质数据失败', 500);
  }
}

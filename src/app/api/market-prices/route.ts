import { prisma } from '@/lib/db/prisma';
import { requireAuth, requireSuperAdmin, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { z } from 'zod';

const createSchema = z.object({
  species: z.string().min(1, '品种不能为空'),
  specification: z.string().optional(),
  minPrice: z.number().nonnegative().optional(),
  maxPrice: z.number().nonnegative().optional(),
  avgPrice: z.number().nonnegative().optional(),
  priceDate: z.string().optional(),
  source: z.string().optional(),
});

// 批发行情
// GET 无 species:返回每个品种最新一天的报价;有 species:该品种分页历史
export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    const page = Number(searchParams.get('page') || 1);
    const pageSize = Number(searchParams.get('pageSize') || 50);

    if (!species) {
      // 最近 500 条里按品种取最新
      const recent = await prisma.marketPrice.findMany({
        orderBy: { priceDate: 'desc' },
        take: 500,
      });
      const latestMap = new Map<string, (typeof recent)[number]>();
      for (const item of recent) {
        if (!latestMap.has(item.species)) latestMap.set(item.species, item);
      }
      const items = [...latestMap.values()].sort((a, b) => a.species.localeCompare(b.species, 'zh'));
      return jsonResponse({ items, total: items.length });
    }

    const where = { species };
    const [total, items] = await Promise.all([
      prisma.marketPrice.count({ where }),
      prisma.marketPrice.findMany({
        where,
        orderBy: { priceDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonResponse({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '行情加载失败', 500);
  }
}

// 超管录入行情报价
export async function POST(request: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const body = await request.json();
    const data = createSchema.parse(body);

    // 均价缺省时取区间中值
    let avgPrice = data.avgPrice;
    if (avgPrice == null && data.minPrice != null && data.maxPrice != null) {
      avgPrice = Number(((data.minPrice + data.maxPrice) / 2).toFixed(2));
    }

    const record = await prisma.marketPrice.create({
      data: {
        species: data.species.trim(),
        specification: data.specification?.trim() || null,
        minPrice: data.minPrice ?? null,
        maxPrice: data.maxPrice ?? null,
        avgPrice,
        priceDate: data.priceDate ? new Date(data.priceDate) : new Date(),
        source: data.source?.trim() || null,
      },
    });

    await createAuditLog({
      ctx,
      action: 'create',
      module: 'market_price',
      targetId: record.id,
      newValue: record,
    });

    return jsonResponse(record);
  } catch (err) {
    if (err instanceof z.ZodError) return errorResponse(err.issues[0]?.message || '参数错误');
    return errorResponse(err instanceof Error ? err.message : '行情录入失败', 500);
  }
}

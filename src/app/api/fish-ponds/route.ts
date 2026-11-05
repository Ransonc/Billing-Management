import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 鱼塘列表(企业内隔离)
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    // 不分页模式(下拉选择用)
    const all = searchParams.get('all') === '1';

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fishSpecies: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;

    if (all) {
      const items = await prisma.fishPond.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      });
      return jsonResponse({ items, total: items.length });
    }

    const [items, total] = await Promise.all([
      prisma.fishPond.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: { select: { id: true, name: true } },
          _count: { select: { saleRecords: true, waterQualities: true } },
        },
      }),
      prisma.fishPond.count({ where }),
    ]);

    return jsonResponse({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取鱼塘列表失败', 500);
  }
}

// 创建鱼塘
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.name) return errorResponse('鱼塘名称不能为空');

    const pond = await prisma.fishPond.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        customerId: body.customerId || null,
        name: body.name,
        area: body.area === '' || body.area == null ? null : Number(body.area),
        waterDepth: body.waterDepth === '' || body.waterDepth == null ? null : Number(body.waterDepth),
        fishSpecies: body.fishSpecies || null,
        stockDate: body.stockDate ? new Date(body.stockDate) : null,
        stockQuantity: body.stockQuantity ? Number(body.stockQuantity) : null,
        stockWeight: body.stockWeight === '' || body.stockWeight == null ? null : Number(body.stockWeight),
        status: body.status || 'active',
        notes: body.notes || null,
      },
    });

    await createAuditLog({ ctx, action: 'create', module: 'fish_pond', targetId: pond.id });
    return jsonResponse(pond);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '创建鱼塘失败', 500);
  }
}

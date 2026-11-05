import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 药品库存列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const lowStock = searchParams.get('lowStock') === '1';
    const all = searchParams.get('all') === '1';

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specification: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (all) {
      const items = await prisma.drugInventory.findMany({
        where: { ...where, status: 'active' },
        orderBy: { name: 'asc' },
      });
      return jsonResponse({ items, total: items.length });
    }

    // 低库存预警在内存中过滤(stockQuantity <= safetyStock)
    const [items, total] = await Promise.all([
      prisma.drugInventory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.drugInventory.count({ where }),
    ]);

    const filtered = lowStock
      ? items.filter((d) => d.stockQuantity <= d.safetyStock)
      : items;

    return jsonResponse({
      items: filtered,
      total: lowStock ? filtered.length : total,
      page,
      pageSize,
      totalPages: Math.ceil((lowStock ? filtered.length : total) / pageSize),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取药品列表失败', 500);
  }
}

// 新增药品
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.name || !body.unit) {
      return errorResponse('药品名称和单位不能为空');
    }

    const drug = await prisma.drugInventory.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        name: body.name,
        specification: body.specification || null,
        unit: body.unit,
        supplier: body.supplier || null,
        purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null,
        salePrice: body.salePrice ? Number(body.salePrice) : null,
        stockQuantity: body.stockQuantity ? Number(body.stockQuantity) : 0,
        safetyStock: body.safetyStock ? Number(body.safetyStock) : 0,
      },
    });

    await createAuditLog({ ctx, action: 'create', module: 'drug', targetId: drug.id });
    return jsonResponse(drug);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '新增药品失败', 500);
  }
}

import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { applyPurchase, calculateDrugSaleTotal } from '@/server/calculations';

// 采购记录列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const drugId = searchParams.get('drugId');

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (drugId) where.drugId = drugId;

    const [items, total] = await Promise.all([
      prisma.drugPurchase.findMany({
        where,
        orderBy: { purchaseDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { drug: { select: { id: true, name: true, unit: true } } },
      }),
      prisma.drugPurchase.count({ where }),
    ]);

    return jsonResponse({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取采购记录失败', 500);
  }
}

// 采购入库:写采购单 + 库存自动增加(事务),可同步更新成本价
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.drugId || !body.quantity || body.unitPrice == null || !body.purchaseDate) {
      return errorResponse('药品、数量、单价、日期不能为空');
    }
    if (!body.supplier) return errorResponse('供应商不能为空');

    const quantity = Number(body.quantity);
    const unitPrice = Number(body.unitPrice);
    if (quantity <= 0) return errorResponse('采购数量必须大于 0');

    const drug = await prisma.drugInventory.findFirst({
      where: { id: body.drugId, enterpriseId: ctx.enterpriseId! },
      select: { id: true, stockQuantity: true },
    });
    if (!drug) return errorResponse('药品不存在', 404);

    const totalCost = calculateDrugSaleTotal(quantity, unitPrice);

    const result = await prisma.$transaction(async (tx) => {
      const purchase = await tx.drugPurchase.create({
        data: {
          enterpriseId: ctx.enterpriseId!,
          drugId: body.drugId,
          supplier: body.supplier,
          quantity,
          unitPrice,
          totalCost,
          purchaseDate: new Date(body.purchaseDate),
          operatorId: ctx.userId,
          notes: body.notes || null,
        },
      });

      const newStock = applyPurchase(drug.stockQuantity, quantity);
      await tx.drugInventory.update({
        where: { id: drug.id },
        // 采购价更新为最新成本价
        data: { stockQuantity: newStock, purchasePrice: unitPrice },
      });

      return purchase;
    });

    await createAuditLog({ ctx, action: 'create', module: 'drug_purchase', targetId: result.id });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '采购入库失败', 500);
  }
}

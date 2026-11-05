import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { applySale, calculateDrugSaleTotal, initDebt } from '@/server/calculations';
import { PAYMENT_STATUS } from '@/lib/constants';

// 药品销售列表
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const paymentStatus = searchParams.get('paymentStatus');
    const customerId = searchParams.get('customerId');

    const where: Record<string, unknown> = { ...buildEnterpriseWhere(ctx) };
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (customerId) where.customerId = customerId;

    const [items, total] = await Promise.all([
      prisma.drugSale.findMany({
        where,
        orderBy: { saleDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          drug: { select: { id: true, name: true, unit: true } },
          customer: { select: { id: true, name: true } },
        },
      }),
      prisma.drugSale.count({ where }),
    ]);

    return jsonResponse({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取销售记录失败', 500);
  }
}

// 药品销售出库:库存校验 → 扣库存 → 销售单 → 未付清自动生成欠款单
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.drugId || !body.quantity || !body.saleDate) {
      return errorResponse('药品、数量、日期不能为空');
    }
    const quantity = Number(body.quantity);
    if (quantity <= 0) return errorResponse('销售数量必须大于 0');

    const drug = await prisma.drugInventory.findFirst({
      where: { id: body.drugId, enterpriseId: ctx.enterpriseId! },
    });
    if (!drug) return errorResponse('药品不存在', 404);

    const unitPrice =
      body.unitPrice != null && body.unitPrice !== '' ? Number(body.unitPrice) : Number(drug.salePrice || 0);
    if (unitPrice <= 0) return errorResponse('请填写有效销售单价');

    const paidAmount = body.paidAmount ? Number(body.paidAmount) : 0;
    if (paidAmount < 0) return errorResponse('已付金额不能为负');

    const totalAmount = calculateDrugSaleTotal(quantity, unitPrice);
    if (paidAmount > totalAmount) return errorResponse('已付金额不能超过应收金额');
    const debtAmount = Number((totalAmount - paidAmount).toFixed(2));
    if (debtAmount > 0 && !body.customerId) {
      return errorResponse('赊账(未付清)销售必须选择客户');
    }

    const stockResult = applySale(drug.stockQuantity, quantity);
    if (!stockResult.ok) return errorResponse(stockResult.reason || '库存不足');

    const paymentStatus =
      debtAmount === 0
        ? PAYMENT_STATUS.PAID
        : paidAmount > 0
        ? PAYMENT_STATUS.PARTIAL
        : PAYMENT_STATUS.UNPAID;

    const result = await prisma.$transaction(async (tx) => {
      // 1. 扣减库存
      await tx.drugInventory.update({
        where: { id: drug.id },
        data: { stockQuantity: stockResult.newStock },
      });

      // 2. 销售单
      const sale = await tx.drugSale.create({
        data: {
          enterpriseId: ctx.enterpriseId!,
          drugId: drug.id,
          customerId: body.customerId || null,
          fishPondId: body.fishPondId || null,
          quantity,
          unitPrice,
          totalAmount,
          paidAmount,
          debtAmount,
          paymentStatus,
          saleDate: new Date(body.saleDate),
          operatorId: ctx.userId,
          notes: body.notes || null,
        },
      });

      // 3. 未付清 → 生成欠款单
      let debtId: string | null = null;
      if (debtAmount > 0) {
        const init = initDebt(debtAmount, 0);
        const debt = await tx.debt.create({
          data: {
            enterpriseId: ctx.enterpriseId!,
            customerId: body.customerId,
            totalAmount: init.totalAmount,
            paidAmount: 0,
            remainingAmount: init.remainingAmount,
            status: init.status,
          },
        });
        debtId = debt.id;
      }

      // 4. 实收部分记收入账(利润链取数用)
      if (paidAmount > 0) {
        await tx.financeRecord.create({
          data: {
            enterpriseId: ctx.enterpriseId!,
            type: 'income',
            category: 'sales',
            amount: paidAmount,
            description: `药品销售实收:${drug.name} x${quantity}`,
            recordDate: new Date(body.saleDate),
            relatedId: sale.id,
            relatedType: 'drug_sale',
            operatorId: ctx.userId,
          },
        });
      }

      return { sale, debtId };
    });

    await createAuditLog({ ctx, action: 'create', module: 'drug_sale', targetId: result.sale.id });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '药品销售失败', 500);
  }
}

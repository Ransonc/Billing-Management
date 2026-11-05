import { prisma } from '@/lib/db/prisma';
import { requireAuth, assertEnterpriseAccess, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { applyDebtPayment } from '@/server/calculations';

// 回款记录列表
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await prisma.debt.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const payments = await prisma.debtPayment.findMany({
      where: { debtId: id },
      orderBy: { paymentDate: 'desc' },
    });
    return jsonResponse(payments);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取回款记录失败', 500);
  }
}

// 登记回款(事务):写回款明细 + 自动更新剩余金额与状态
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const amount = Number(body.amount);
    if (!amount || amount <= 0) return errorResponse('回款金额必须大于 0');
    if (!body.paymentDate) return errorResponse('回款日期不能为空');

    const debt = await prisma.debt.findUnique({ where: { id } });
    if (!debt) return errorResponse('欠款单不存在', 404);
    assertEnterpriseAccess(ctx, debt.enterpriseId);

    if (amount > Number(debt.remainingAmount)) {
      return errorResponse(`回款金额不能超过剩余欠款 ${debt.remainingAmount}`);
    }

    const next = applyDebtPayment(
      { totalAmount: Number(debt.totalAmount), paidAmount: Number(debt.paidAmount) },
      amount
    );

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.debtPayment.create({
        data: {
          enterpriseId: ctx.enterpriseId!,
          debtId: id,
          amount,
          paymentDate: new Date(body.paymentDate),
          paymentMethod: body.paymentMethod || null,
          operatorId: ctx.userId,
          notes: body.notes || null,
        },
      });

      await tx.debt.update({
        where: { id },
        data: {
          paidAmount: next.paidAmount,
          remainingAmount: next.remainingAmount,
          status: next.status,
        },
      });

      return payment;
    });

    await createAuditLog({ ctx, action: 'create', module: 'debt_payment', targetId: id });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '登记回款失败', 500);
  }
}

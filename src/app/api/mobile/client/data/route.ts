import { prisma } from '@/lib/db/prisma';
import { requireAuth } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';

// 客户(养殖户)移动端只读数据接口
// 数据隔离:登录用户 user.employeeId 关联 customers.id,只能看自己名下鱼塘
export async function GET() {
  try {
    const ctx = await requireAuth();
    if (ctx.role !== ROLES.CUSTOMER) {
      return errorResponse('仅客户账号可访问', 403);
    }

    // 取客户映射(schema: user.employeeId 在 role=customer 时关联 customer.id)
    const dbUser = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { employeeId: true },
    });
    const customerId = dbUser?.employeeId;
    if (!customerId) {
      return errorResponse('当前账号未关联客户档案,请联系服务商绑定', 400);
    }

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, phone: true, address: true, enterpriseId: true },
    });
    if (!customer || customer.enterpriseId !== ctx.enterpriseId) {
      return errorResponse('客户档案不存在或无访问权限', 404);
    }

    const ponds = await prisma.fishPond.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        waterQualities: { orderBy: { recordDate: 'desc' }, take: 10 },
        drugRecords: { orderBy: { startDate: 'desc' }, take: 10 },
        saleRecords: { orderBy: { saleDate: 'desc' }, take: 10 },
        fishStockings: { orderBy: { stockDate: 'desc' }, take: 1 },
      },
    });

    return jsonResponse({ customer, ponds });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '数据加载失败', 500);
  }
}

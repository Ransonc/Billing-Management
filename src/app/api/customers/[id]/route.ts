import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere, assertEnterpriseAccess } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 客户详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const customer = await prisma.customer.findFirst({
      where: { id, ...buildEnterpriseWhere(ctx) },
      include: {
        fishPonds: true,
        debts: { where: { status: { not: 'settled' } } },
        _count: { select: { fishPonds: true } },
      },
    });

    if (!customer) {
      return errorResponse('客户不存在', 404);
    }

    return jsonResponse(customer);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取客户详情失败', 500);
  }
}

// 更新客户
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    // 校验企业归属
    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    const body = await request.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        contactPerson: body.contactPerson,
        status: body.status,
        notes: body.notes,
      },
    });

    return jsonResponse(customer);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新客户失败', 500);
  }
}

// 删除客户(软删除)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;

    const existing = await prisma.customer.findUnique({
      where: { id },
      select: { enterpriseId: true },
    });
    assertEnterpriseAccess(ctx, existing?.enterpriseId);

    await prisma.customer.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '删除客户失败', 500);
  }
}

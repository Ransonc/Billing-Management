import { prisma } from '@/lib/db/prisma';
import { requireSuperAdmin } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 获取单个企业详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    const enterprise = await prisma.enterprise.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, customers: true, fishPonds: true } },
      },
    });

    if (!enterprise) {
      return errorResponse('企业不存在', 404);
    }

    return jsonResponse(enterprise);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取企业详情失败', 500);
  }
}

// 更新企业
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();

    const enterprise = await prisma.enterprise.update({
      where: { id },
      data: {
        name: body.name,
        contactName: body.contactName,
        contactPhone: body.contactPhone,
        status: body.status,
        subscription: body.subscription,
      },
    });

    return jsonResponse(enterprise);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新企业失败', 500);
  }
}

// 删除企业(软删除:设为 inactive)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;

    await prisma.enterprise.update({
      where: { id },
      data: { status: 'inactive' },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '删除企业失败', 500);
  }
}

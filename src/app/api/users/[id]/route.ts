import { prisma } from '@/lib/db/prisma';
import { requireSuperAdmin, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { createServiceRoleClient } from '@/lib/auth/supabase';

// 用户详情
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { enterprise: { select: { id: true, name: true } } },
    });
    if (!user) return errorResponse('用户不存在', 404);
    return jsonResponse(user);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取用户失败', 500);
  }
}

// 编辑用户(姓名/手机/角色/企业)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return errorResponse('用户不存在', 404);

    // 可选:重置 Supabase 登录密码
    if (body.password) {
      const supabaseAdmin = createServiceRoleClient();
      const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        password: body.password,
      });
      if (pwdError) {
        return errorResponse(`重置密码失败: ${pwdError.message}`);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        phone: body.phone ?? existing.phone,
        role: body.role ?? existing.role,
        enterpriseId: body.enterpriseId === undefined ? existing.enterpriseId : body.enterpriseId,
        employeeId: body.employeeId === undefined ? existing.employeeId : body.employeeId,
      },
      include: { enterprise: { select: { id: true, name: true } } },
    });

    await createAuditLog({ ctx, action: 'update', module: 'user', targetId: id, newValue: user });
    return jsonResponse(user);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '更新用户失败', 500);
  }
}

// 启用/禁用用户
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireSuperAdmin();
    const { id } = await params;
    const body = await request.json();

    if (id === ctx.userId) {
      return errorResponse('不能禁用当前登录账号');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(body.isActive) },
    });

    await createAuditLog({
      ctx,
      action: 'update',
      module: 'user',
      targetId: id,
      newValue: { isActive: user.isActive },
    });
    return jsonResponse(user);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '操作失败', 500);
  }
}

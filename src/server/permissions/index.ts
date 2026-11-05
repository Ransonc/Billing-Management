// 服务端权限校验工具
// 在 Route Handlers 和 Server Actions 中使用

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import type { Role } from '@/lib/constants';
import { ROLES } from '@/lib/constants';

export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
  enterpriseId: string | null;
}

// 从 Supabase session 获取当前用户信息
export async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // 从 users 表查角色和企业
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, role: true, enterpriseId: true },
    });

    // 超管:enterpriseId 为 null
    return {
      userId: user.id,
      email: user.email || dbUser?.email || '',
      role: (dbUser?.role as Role) || ROLES.CUSTOMER,
      enterpriseId: dbUser?.enterpriseId || null,
    };
  } catch {
    return null;
  }
}

// 要求已登录
export async function requireAuth(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error('UNAUTHENTICATED');
  }
  return ctx;
}

// 要求特定角色
export async function requireRoles(allowedRoles: Role[]): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!allowedRoles.includes(ctx.role)) {
    throw new Error('FORBIDDEN');
  }
  return ctx;
}

// 要求超管
export async function requireSuperAdmin(): Promise<AuthContext> {
  return requireRoles([ROLES.SUPER_ADMIN]);
}

// 企业数据访问校验(确保只能访问自己企业的数据)
export function assertEnterpriseAccess(
  ctx: AuthContext,
  targetEnterpriseId: string | null | undefined
): void {
  // 超管可访问所有企业数据
  if (ctx.role === ROLES.SUPER_ADMIN) return;
  // 其他角色必须 enterpriseId 匹配
  if (!targetEnterpriseId || targetEnterpriseId !== ctx.enterpriseId) {
    throw new Error('ENTERPRISE_MISMATCH');
  }
}

// 从 Prisma 查询中根据角色添加企业过滤
export function buildEnterpriseWhere(ctx: AuthContext) {
  // 超管:不过滤
  if (ctx.role === ROLES.SUPER_ADMIN) return {};
  // 其他:强制 enterpriseId 过滤
  if (!ctx.enterpriseId) {
    throw new Error('NO_ENTERPRISE');
  }
  return { enterpriseId: ctx.enterpriseId };
}

// 审计日志记录
export async function createAuditLog(params: {
  ctx: AuthContext;
  action: string;
  module: string;
  targetId?: string;
  targetType?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.ctx.userId,
        userEmail: params.ctx.email,
        enterpriseId: params.ctx.enterpriseId,
        action: params.action,
        module: params.module,
        targetId: params.targetId,
        targetType: params.targetType,
        oldValue: params.oldValue as Prisma.InputJsonValue,
        newValue: params.newValue as Prisma.InputJsonValue,
      },
    });
  } catch {
    // 审计日志失败不应阻断主流程
  }
}

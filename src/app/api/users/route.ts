import { prisma } from '@/lib/db/prisma';
import { requireSuperAdmin, createAuditLog } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { createServiceRoleClient } from '@/lib/auth/supabase';
import { ROLES } from '@/lib/constants';

// 用户列表(仅超管)
export async function GET(request: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const enterpriseId = searchParams.get('enterpriseId');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (enterpriseId) where.enterpriseId = enterpriseId;

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { enterprise: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return jsonResponse({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取用户列表失败', 500);
  }
}

// 创建用户(仅超管):先在 Supabase Auth 建账号,再写业务表
export async function POST(request: Request) {
  try {
    const ctx = await requireSuperAdmin();
    const body = await request.json();

    if (!body.email || !body.name || !body.role) {
      return errorResponse('邮箱、姓名、角色不能为空');
    }
    if (!Object.values(ROLES).includes(body.role)) {
      return errorResponse('角色非法');
    }
    if (body.role !== ROLES.SUPER_ADMIN && !body.enterpriseId) {
      return errorResponse('非超管用户必须关联企业');
    }

    // 1. Supabase Auth 创建账号
    const supabaseAdmin = createServiceRoleClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password || '12345678',
      email_confirm: true,
      user_metadata: { name: body.name, role: body.role },
    });

    if (authError || !authData.user) {
      return errorResponse(`创建登录账号失败: ${authError?.message || '未知错误'}`);
    }

    // 2. 业务表建档
    const user = await prisma.user.create({
      data: {
        id: authData.user.id,
        email: body.email,
        name: body.name,
        phone: body.phone || null,
        role: body.role,
        enterpriseId: body.role === ROLES.SUPER_ADMIN ? null : body.enterpriseId,
        employeeId: body.employeeId || null,
      },
      include: { enterprise: { select: { id: true, name: true } } },
    });

    await createAuditLog({ ctx, action: 'create', module: 'user', targetId: user.id, newValue: user });

    return jsonResponse(user);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '创建用户失败', 500);
  }
}

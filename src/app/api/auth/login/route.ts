import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { prisma } from '@/lib/db/prisma';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/lib/constants';

const ROLE_REDIRECTS: Record<Role, string> = {
  [ROLES.SUPER_ADMIN]: '/overview',
  [ROLES.OWNER]: '/dashboard',
  [ROLES.EMPLOYEE]: '/mobile/employee',
  [ROLES.CUSTOMER]: '/mobile/client',
};

// 登录接口 - 对接 Supabase Auth
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('请输入邮箱和密码');
    }

    const supabase = await createServerSupabaseClient();

    // Supabase 密码登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return errorResponse('邮箱或密码错误', 401);
    }

    // 从数据库查询用户角色
    const dbUser = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: { id: true, role: true, enterpriseId: true },
    });

    // 如果用户没在 users 表,用默认角色
    const role: Role = (dbUser?.role as Role) || ROLES.CUSTOMER;
    const redirectUrl = ROLE_REDIRECTS[role] || '/dashboard';

    return jsonResponse({ redirectUrl, role, userId: data.user.id });
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse('登录失败,请稍后重试', 500);
  }
}

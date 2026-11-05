import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 需要登录才能访问的路由
const PROTECTED_ROUTES = [
  '/dashboard',
  '/overview',
  '/customers',
  '/fish-ponds',
  '/drugs',
  '/sales',
  '/debts',
  '/employees',
  '/attendance',
  '/reports',
  '/finance',
  '/market',
  '/audit-logs',
  '/import',
  '/mobile',
  '/system-config',
  '/enterprises',
  '/users',
];

// 仅超管可访问
const SUPER_ADMIN_ROUTES = [
  '/enterprises',
  '/users',
  '/audit-logs',
  '/system-config',
  '/market-prices',
];

// 公开路由
const PUBLIC_ROUTES = ['/login', '/api/auth/callback'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 公开路由直接放行
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // 检查 session(从 cookie 或 authorization header)
  const hasSession =
    request.cookies.has('sb-access-token') ||
    request.headers.has('authorization');

  // 受保护路由需要登录
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // 匹配所有路由,但排除静态资源和 API
    '/((?!_next/static|_next/image|favicon.ico|public|api/health).*)',
  ],
};

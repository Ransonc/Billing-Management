import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

// 获取当前登录用户信息
export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      metadata: user.user_metadata,
    },
  }, { status: 200 });
}

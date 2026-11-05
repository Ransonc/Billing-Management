import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

// 登出路由 - 清除 session
export async function POST() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

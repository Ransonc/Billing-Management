import { redirect } from 'next/navigation';

// 根路由重定向到登录页
export default function Home() {
  redirect('/login');
}

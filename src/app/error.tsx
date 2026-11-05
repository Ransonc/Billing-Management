'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// 路由级错误边界:任一页面渲染/数据加载失败时兜底展示,避免直接白屏
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('页面渲染出错:', error);
  }, [error]);

  return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-lg font-semibold text-gray-800 mb-1">页面加载失败</h2>
      <p className="text-sm text-gray-500 mb-5">
        数据加载出现问题,请稍后重试。若持续失败,请联系管理员检查数据源连接。
      </p>
      <div className="flex items-center justify-center gap-3">
        <Button onClick={reset}>重新加载</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/login')}>
          返回登录
        </Button>
      </div>
    </div>
  );
}

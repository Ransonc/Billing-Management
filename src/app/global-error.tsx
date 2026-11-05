'use client';

import { useEffect } from 'react';

// 根级错误边界:整个应用(含根布局)崩溃时的最后兜底
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('应用发生严重错误:', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐟</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>系统开小差了</h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
            应用发生异常,请刷新页面重试。
          </p>
          <button
            onClick={reset}
            style={{
              padding: '8px 20px',
              fontSize: 14,
              color: '#fff',
              background: '#1e6fd9',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            刷新重试
          </button>
        </div>
      </body>
    </html>
  );
}

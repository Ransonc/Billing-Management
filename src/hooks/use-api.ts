'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api, translateError } from '@/lib/utils/api';
import type { ApiResponse } from '@/types';

// 封装的 API 调用 hook,统一处理 loading/error/toast
export function useApi<T = unknown>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async (request: () => Promise<ApiResponse<T>>, options?: { showError?: boolean; showSuccess?: boolean; successMsg?: string }): Promise<T | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await request();
        if (options?.showSuccess) {
          toast.success(options.successMsg || '操作成功');
        }
        return response.data ?? null;
      } catch (err) {
        const message = translateError(err);
        setError(message);
        if (options?.showError !== false) {
          toast.error(message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { call, loading, error, reset };
}

// 更简单的版本:直接返回数据或抛错
export async function safeApiCall<T>(
  request: Promise<ApiResponse<T>>,
  options?: { showError?: boolean; showSuccess?: boolean; successMsg?: string }
): Promise<T | null> {
  try {
    const response = await request;
    if (options?.showSuccess) {
      toast.success(options.successMsg || '操作成功');
    }
    return response.data ?? null;
  } catch (err) {
    const message = translateError(err);
    if (options?.showError !== false) {
      toast.error(message);
    }
    return null;
  }
}

export { api };

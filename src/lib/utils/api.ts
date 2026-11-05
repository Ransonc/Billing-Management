import type { ApiResponse } from '@/types';

// ============ 服务端响应工具(用于 Route Handlers) ============

// Prisma Decimal 在 JSON 序列化时转为 number,避免输出空对象
function decimalAwareReplacer(_key: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === 'object' &&
    (value as { constructor?: { name?: string } }).constructor?.name === 'Decimal'
  ) {
    return Number(value);
  }
  return value;
}

export function jsonResponse<T>(data: T, init?: ResponseInit): Response {
  const body = JSON.stringify({ success: true, data }, decimalAwareReplacer);
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

// 统一错误码映射
export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHENTICATED: '请先登录',
  FORBIDDEN: '没有权限执行此操作',
  ENTERPRISE_MISMATCH: '无权访问其他企业数据',
  NO_ENTERPRISE: '未关联企业',
  NOT_FOUND: '记录不存在',
  VALIDATION_ERROR: '数据校验失败',
  CONFLICT: '数据冲突,请刷新后重试',
  INTERNAL_ERROR: '服务器内部错误',
};

// 已知业务错误码对应的 HTTP 状态码
// 各路由的 catch 统一把它当未知异常传 500,这里纠正为规范状态码与中文文案
export const ERROR_STATUS: Record<string, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  ENTERPRISE_MISMATCH: 403,
  NO_ENTERPRISE: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function errorResponse(
  error: string,
  status = 400,
  details?: unknown
): Response {
  // 命中已知业务错误码时,以规范状态码 + 中文文案返回
  const mappedStatus = ERROR_STATUS[error];
  const message = ERROR_MESSAGES[error] ?? error;

  return Response.json(
    { success: false, error: message, ...(details ? { details } : {}) } satisfies ApiResponse,
    { status: mappedStatus ?? status }
  );
}

// 把已知错误码转成中文消息
export function translateError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message in ERROR_MESSAGES) {
      return ERROR_MESSAGES[error.message];
    }
    return error.message;
  }
  return '未知错误';
}

// ============ 客户端请求工具(用于客户端组件) ============

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

// 封装 fetch,自动处理 JSON 和错误
export async function apiFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    // FormData 时让浏览器自动带 multipart boundary
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body
      ? isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  });

  const data = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok || !data.success) {
    throw new Error(data.error || translateError(data.error) || `请求失败(${res.status})`);
  }

  return data;
}

// 快捷方法
export const api = {
  get: <T>(url: string) => apiFetch<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) => apiFetch<T>(url, { method: 'POST', body }),
  put: <T>(url: string, body?: unknown) => apiFetch<T>(url, { method: 'PUT', body }),
  patch: <T>(url: string, body?: unknown) => apiFetch<T>(url, { method: 'PATCH', body }),
  delete: <T>(url: string) => apiFetch<T>(url, { method: 'DELETE' }),
  upload: <T>(url: string, form: FormData) => apiFetch<T>(url, { method: 'POST', body: form }),
};

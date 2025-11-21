export type ApiError = {
  message: string;
  status?: number;
};

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL : `${RAW_API_BASE_URL}/`;

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', data, token, headers: customHeaders } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders ?? {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const normalizedPath = path.replace(/^\/+/, '');
  const url = new URL(normalizedPath, API_BASE_URL).toString();

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
    credentials: 'include'
  });

  if (!response.ok) {
    let message = 'サーバーでエラーが発生しました';
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? message;
    } catch (error) {
      // ignore
    }
    const error: ApiError = { message, status: response.status };
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { API_BASE_URL };

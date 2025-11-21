export type ApiError = {
  message: string;
  status?: number;
};

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  token?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', data, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = "サーバーでエラーが発生しました";
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? message;
    } catch {}
    throw { message, status: response.status };
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

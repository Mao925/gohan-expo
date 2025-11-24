export type ApiError = {
  message: string;
  status?: number;
  isServerError?: boolean;
  isNetworkError?: boolean;
};

export type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
};

const DEFAULT_API_BASE_URL = 'https://gohan-nest-production.up.railway.app';
const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL : `${RAW_API_BASE_URL}/`;
const SERVER_UNAVAILABLE_MESSAGE = '現在サーバー側で問題が発生しています。時間をおいて再度お試しください。';

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

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      cache: 'no-store',
      credentials: 'include'
    });
  } catch (error) {
    const networkError: ApiError = {
      message: SERVER_UNAVAILABLE_MESSAGE,
      isNetworkError: true,
      isServerError: true
    };
    throw networkError;
  }

  if (!response.ok) {
    const isServerError = response.status >= 500;
    let message = isServerError ? SERVER_UNAVAILABLE_MESSAGE : 'サーバーでエラーが発生しました';
    try {
      const errorBody = await response.json();
      message = errorBody?.message ?? message;
      if (isServerError) {
        message = SERVER_UNAVAILABLE_MESSAGE;
      }
    } catch (error) {
      // ignore
    }
    const error: ApiError = { message, status: response.status, isServerError };
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export { API_BASE_URL, SERVER_UNAVAILABLE_MESSAGE };

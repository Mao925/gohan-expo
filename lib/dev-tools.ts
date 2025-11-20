import { API_BASE_URL } from './api';

function resolveEndpoint(envValue: string | undefined, fallbackPath: string) {
  if (envValue && envValue.length > 0) return envValue;
  if (!API_BASE_URL) return undefined;
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  return `${base}${fallbackPath}`;
}

const DEV_APPROVE_ENDPOINT = resolveEndpoint(process.env.NEXT_PUBLIC_DEV_APPROVE_ENDPOINT, '/api/dev/approve-me');
const DEV_RESET_ENDPOINT = resolveEndpoint(process.env.NEXT_PUBLIC_DEV_RESET_ENDPOINT, '/api/dev/reset-status');
const DEV_RESET_LIKE_ENDPOINT = resolveEndpoint(process.env.NEXT_PUBLIC_DEV_RESET_LIKE_ENDPOINT, '/api/dev/reset-like-state');
const ADMIN_SEED_DELETE_ENDPOINT = resolveEndpoint(process.env.NEXT_PUBLIC_ADMIN_SEED_DELETE_ENDPOINT, '/api/admin/seed-admin');

export async function triggerDevApprove(token: string) {
  if (!DEV_APPROVE_ENDPOINT) throw new Error('DEV APPROVE ENDPOINT is not defined');
  return callDevEndpoint(DEV_APPROVE_ENDPOINT, token);
}

export async function triggerDevReset(token: string) {
  if (!DEV_RESET_ENDPOINT) throw new Error('DEV RESET ENDPOINT is not defined');
  return callDevEndpoint(DEV_RESET_ENDPOINT, token);
}

export async function triggerDevResetLikes(token: string) {
  if (!DEV_RESET_LIKE_ENDPOINT) throw new Error('DEV RESET LIKE ENDPOINT is not defined');
  return callDevEndpoint(DEV_RESET_LIKE_ENDPOINT, token);
}

export async function deleteSeedAdmin(token: string) {
  if (!ADMIN_SEED_DELETE_ENDPOINT) throw new Error('ADMIN SEED DELETE ENDPOINT is not defined');
  return callDevEndpoint(ADMIN_SEED_DELETE_ENDPOINT, token, 'DELETE');
}

async function callDevEndpoint(endpoint: string, token: string, method: 'POST' | 'DELETE' = 'POST') {
  const res = await fetch(endpoint, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? '開発エンドポイントの呼び出しに失敗しました');
  }

  return res.status === 204 ? null : res.json().catch(() => null);
}

export { DEV_APPROVE_ENDPOINT, DEV_RESET_ENDPOINT, DEV_RESET_LIKE_ENDPOINT, ADMIN_SEED_DELETE_ENDPOINT };

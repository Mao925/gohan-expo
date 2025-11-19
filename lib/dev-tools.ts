const DEV_APPROVE_ENDPOINT = process.env.NEXT_PUBLIC_DEV_APPROVE_ENDPOINT;
const DEV_RESET_ENDPOINT = process.env.NEXT_PUBLIC_DEV_RESET_ENDPOINT;
const DEV_RESET_LIKE_ENDPOINT = process.env.NEXT_PUBLIC_DEV_RESET_LIKE_ENDPOINT;

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

async function callDevEndpoint(endpoint: string, token: string) {
  const res = await fetch(endpoint, {
    method: 'POST',
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

export { DEV_APPROVE_ENDPOINT, DEV_RESET_ENDPOINT, DEV_RESET_LIKE_ENDPOINT };

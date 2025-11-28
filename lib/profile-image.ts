import { API_BASE_URL } from '@/lib/api';

export function resolveProfileImageUrl(raw?: string | null): string | null {
  if (!raw) {
    return null;
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }
  try {
    return new URL(raw, API_BASE_URL).toString();
  } catch {
    return raw;
  }
}

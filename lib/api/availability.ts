import { apiFetch } from '@/lib/api';
import { OverlapSlotDto } from '@/lib/types';

export async function fetchOverlapAvailability(partnerUserId: string, token?: string | null): Promise<OverlapSlotDto[]> {
  // Small wrapper so callers can keep business logic clean and reuse apiFetch defaults.
  return apiFetch<OverlapSlotDto[]>(`/api/availability/overlap/${partnerUserId}`, { token });
}

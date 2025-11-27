import { apiFetch } from '@/lib/api';
import { OverlapSlotDto, TimeSlot, Weekday } from '@/lib/types';

export type PairAvailabilitySlotDto = {
  weekday: Weekday;
  timeSlot: TimeSlot;
  selfAvailable: boolean;
  partnerAvailable: boolean;
};

export async function fetchOverlapAvailability(partnerUserId: string, token?: string | null): Promise<OverlapSlotDto[]> {
  // Small wrapper so callers can keep business logic clean and reuse apiFetch defaults.
  return apiFetch<OverlapSlotDto[]>(`/api/availability/overlap/${partnerUserId}`, { token });
}

export async function fetchPairAvailability(partnerUserId: string, token?: string | null): Promise<{ slots: PairAvailabilitySlotDto[] }> {
  return apiFetch(`/api/availability/pair/${partnerUserId}`, { token });
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';

export type CommunityPhase = 'NO_COMMUNITY' | 'PENDING' | 'APPROVED';

export type CommunitySummary = {
  id: string;
  name: string;
};

export type CommunitySelfStatus = {
  phase: CommunityPhase;
  isAdmin: boolean;
  community: CommunitySummary | null;
};

// Fetches the viewer's community status to drive gating and navigation.
export function useCommunitySelfStatus(enabled = true) {
  const { token } = useAuth();

  return useQuery<CommunitySelfStatus, ApiError>({
    queryKey: ['community-self-status', token],
    queryFn: () => apiFetch('/api/community/self-status', { method: 'GET', token }),
    enabled: Boolean(enabled && token),
    refetchOnWindowFocus: true,
    refetchInterval: (data) => (data?.phase === 'PENDING' ? 10000 : false)
  });
}

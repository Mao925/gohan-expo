'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { CommunityStatus } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

type StatusResponse = {
  status: CommunityStatus;
  communityName: string;
};

export function useCommunityStatus(options?: { refetchInterval?: number }) {
  const { token } = useAuth();

  return useQuery<StatusResponse>({
    queryKey: ['community-status', token],
    queryFn: () => apiFetch('/api/community/status', { token }),
    enabled: Boolean(token),
    refetchInterval: options?.refetchInterval
  });
}

import { apiFetch } from '@/lib/api';
import type { MembershipStatus } from '@/lib/api';

export type JoinCommunityInput = {
  communityName: string;
  joinCode: string;
};

export type JoinCommunityResponse = {
  membership: {
    id: string;
    status: MembershipStatus;
    communityId: string;
  };
  community: {
    id: string;
    name: string;
  };
};

export async function joinCommunity(
  input: JoinCommunityInput,
  token?: string | null
): Promise<JoinCommunityResponse> {
  return apiFetch<JoinCommunityResponse>('/api/community/join', {
    method: 'POST',
    data: input,
    token
  });
}

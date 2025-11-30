import { getToken } from '@/lib/token-storage';
import type { MatchSummary } from '@/lib/types';

export class ApiError extends Error {
  status: number;
  code?: string;
  data: any;
  isServerError?: boolean;
  isNetworkError?: boolean;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

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
  const resolvedToken = token !== undefined ? token : getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders ?? {})
  };

  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
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
    const apiError = new ApiError(SERVER_UNAVAILABLE_MESSAGE, 0);
    apiError.isNetworkError = true;
    apiError.isServerError = true;
    throw apiError;
  }

  if (!response.ok) {
    const isServerError = response.status >= 500;
    let message = isServerError ? SERVER_UNAVAILABLE_MESSAGE : 'サーバーでエラーが発生しました';
    let errorBody: any = null;
    try {
      errorBody = await response.json();
      message = errorBody?.message ?? message;
      if (isServerError) {
        message = SERVER_UNAVAILABLE_MESSAGE;
      }
    } catch (error) {
      // ignore
    }
    const apiError = new ApiError(message, response.status, errorBody?.code, errorBody);
    apiError.isServerError = isServerError;
    throw apiError;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type GroupMealStatus = 'OPEN' | 'FULL' | 'CLOSED';
export type GroupMealParticipantStatus = 'INVITED' | 'JOINED' | 'DECLINED' | 'CANCELLED';
export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type TimeSlot = 'DAY' | 'NIGHT';

export type GroupMealParticipant = {
  userId: string;
  isHost: boolean;
  status: GroupMealParticipantStatus;
  name: string;
  favoriteMeals: string[];
  profileImageUrl?: string | null;
};

export type GroupMeal = {
  id: string;
  title: string | null;
  date: string;
  weekday: Weekday;
  timeSlot: TimeSlot;
  capacity: number;
  status: GroupMealStatus;
  host: {
    userId: string;
    name: string;
    profileImageUrl?: string | null;
  };
  joinedCount: number;
  remainingSlots: number;
  myStatus?: 'JOINED' | 'INVITED' | 'NONE';
  participants: GroupMealParticipant[];
};

export type GroupMealCandidate = {
  userId: string;
  name: string;
  favoriteMeals: string[];
  profileImageUrl?: string | null;
  isAvailableForSlot: boolean;
};

export type GroupMealCandidatesResponse = {
  candidates: GroupMealCandidate[];
};

export type CreateGroupMealInput = {
  title?: string;
  date: string;
  timeSlot: TimeSlot;
  capacity: number;
};

export async function fetchGroupMeals(token?: string | null): Promise<GroupMeal[]> {
  return apiFetch('/api/group-meals', { token });
}

export async function createGroupMeal(input: CreateGroupMealInput, token?: string | null): Promise<GroupMeal> {
  return apiFetch('/api/group-meals', {
    method: 'POST',
    data: input,
    token
  });
}

export async function fetchGroupMealCandidates(
  groupMealId: string,
  token?: string | null
): Promise<GroupMealCandidatesResponse> {
  return apiFetch(`/api/group-meals/${groupMealId}/candidates`, { token });
}

export async function inviteGroupMealCandidates(groupMealId: string, userIds: string[], token?: string | null): Promise<GroupMeal> {
  return apiFetch(`/api/group-meals/${groupMealId}/invite`, {
    method: 'POST',
    data: { userIds },
    token
  });
}

export async function respondGroupMeal(groupMealId: string, action: 'ACCEPT' | 'DECLINE', token?: string | null): Promise<GroupMeal> {
  return apiFetch(`/api/group-meals/${groupMealId}/respond`, {
    method: 'POST',
    data: { action },
    token
  });
}

export async function joinGroupMeal(groupMealId: string, token?: string | null): Promise<GroupMeal> {
  return apiFetch(`/api/group-meals/${groupMealId}/join`, {
    method: 'POST',
    data: {},
    token
  });
}

export async function leaveGroupMeal(groupMealId: string, token?: string | null): Promise<GroupMeal> {
  return apiFetch<GroupMeal>(`/api/group-meals/${groupMealId}/leave`, {
    method: 'POST',
    data: {},
    token
  });
}

export async function deleteGroupMeal(groupMealId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/api/group-meals/${groupMealId}`, {
    method: 'DELETE',
    token
  });
}

export type Member = {
  id: string;
  name: string | null;
  favoriteMeals: string[];
  profileImageUrl: string | null;
  myLikeStatus: 'YES' | 'NO' | 'NONE';
  isMutualLike: boolean;
};

export async function fetchMembers(): Promise<Member[]> {
  const data = await apiFetch<{ members: Member[] }>('/api/members');
  return data.members;
}

export async function fetchMatches(token?: string | null): Promise<MatchSummary[]> {
  return apiFetch<MatchSummary[]>('/api/matches', { token });
}

export async function updateLikeChoice(
  targetUserId: string,
  choice: 'YES' | 'NO'
): Promise<{ targetUserId: string; myLikeStatus: 'YES' | 'NO'; isMutualLike: boolean }> {
  return apiFetch<{ targetUserId: string; myLikeStatus: 'YES' | 'NO'; isMutualLike: boolean }>(
    `/api/likes/${targetUserId}`,
    {
      method: 'PUT',
      data: { choice }
    }
  );
}

export async function deleteMember(userId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/api/admin/members/${userId}`, {
    method: 'DELETE',
    token
  });
}

export { API_BASE_URL, SERVER_UNAVAILABLE_MESSAGE };

import { getToken } from '@/lib/token-storage';
import type { LikeStatus, MatchSummary } from '@/lib/types';

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
  body?: BodyInit;
  token?: string | null;
  headers?: Record<string, string>;
};

const DEFAULT_API_BASE_URL = 'https://gohan-nest-production.up.railway.app';
const RAW_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;
const API_BASE_URL = RAW_API_BASE_URL.endsWith('/') ? RAW_API_BASE_URL : `${RAW_API_BASE_URL}/`;
const SERVER_UNAVAILABLE_MESSAGE = '現在サーバー側で問題が発生しています。時間をおいて再度お試しください。';

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', data, body, token, headers: customHeaders } = options;
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

  const payload = body ?? (data ? JSON.stringify(data) : undefined);
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: payload,
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

export type GroupMealStatus = 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED';
export type GroupMealBudget = 'UNDER_1000' | 'UNDER_1500' | 'UNDER_2000' | 'OVER_2000';
export type GroupMealParticipantStatus = 'INVITED' | 'JOINED' | 'DECLINED' | 'CANCELLED' | 'LATE';
export type Weekday = 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT';
export type TimeSlot = 'DAY' | 'NIGHT';
export type DrinkingStyle = 'NO_ALCOHOL' | 'SOMETIMES' | 'ENJOY_DRINKING';
export type MealStyle = 'TALK_DEEP' | 'CASUAL_CHAT' | 'BRAINSTORM';
export type GoMealFrequency = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

export type Profile = {
  id: string;
  userId: string;
  name?: string | null;
  profileImageUrl?: string | null;
  favoriteMeals: string[];
  ngFoods: string[];
  areas: string[];
  hobbies: string[];
  mainArea?: string | null;
  subAreas: string[];
  defaultBudget?: GroupMealBudget | null;
  drinkingStyle?: DrinkingStyle | null;
  mealStyle?: MealStyle | null; // legacy
  goMealFrequency?: GoMealFrequency | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GroupMealParticipant = {
  id: string;
  userId: string;
  isHost?: boolean;
  status: GroupMealParticipantStatus;
  user: {
    id: string;
    profile: Profile | null;
  };
  name?: string;
  favoriteMeals?: string[];
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
  meetingPlace: string | null;
  budget: GroupMealBudget | null;
  host: {
    userId: string;
    name: string;
    profileImageUrl?: string | null;
  };
  joinedCount: number;
  remainingSlots: number;
  myStatus?: 'JOINED' | 'INVITED' | 'NONE' | 'LATE' | 'CANCELLED';
  participants: GroupMealParticipant[];
};

export type GroupMealCandidate = {
  userId: string;
  name: string;
  favoriteMeals: string[];
  profile?: Profile | null;
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
  meetingPlace?: string | null;
  budget?: GroupMealBudget | null;
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

export async function updateMyGroupMealStatus(
  groupMealId: string,
  status: Extract<GroupMealParticipantStatus, 'JOINED' | 'LATE' | 'CANCELLED'>
) {
  return apiFetch<{ participant: GroupMealParticipant }>(`/api/group-meals/${groupMealId}/participant/status`, {
    method: 'PATCH',
    data: { status }
  });
}

export function formatBudgetLabel(budget: GroupMealBudget | null): string | null {
  if (!budget) return null;
  switch (budget) {
    case 'UNDER_1000':
      return '〜1000円';
    case 'UNDER_1500':
      return '〜1500円';
    case 'UNDER_2000':
      return '〜2000円';
    case 'OVER_2000':
      return '2000円以上';
    default:
      return null;
  }
}

export type Member = {
  id: string;
  email: string;
  isAdmin?: boolean;
  name?: string | null;
  favoriteMeals?: string[];
  profileImageUrl?: string | null;
  myLikeStatus?: LikeStatus;
  isMutualLike?: boolean;
  profile?: Profile | null;
};

export type MembersResponse = {
  members: Member[];
};

export async function fetchMembers(): Promise<Member[]> {
  const data = await apiFetch<MembersResponse | Member[]>('/api/members');

  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray((data as MembersResponse).members)) {
    return (data as MembersResponse).members;
  }

  return [];
}

export async function fetchMatches(token?: string | null): Promise<MatchSummary[]> {
  return apiFetch<MatchSummary[]>('/api/matches', { token });
}

export type UpdateProfileInput = {
  name?: string;
  profileImageUrl?: string;
  favoriteMeals?: string[];
  ngFoods?: string[];
  areas?: string[];
  hobbies?: string[];
  defaultBudget?: GroupMealBudget | null;
  drinkingStyle?: DrinkingStyle | null;
  goMealFrequency?: GoMealFrequency | null;
  bio?: string | null;
  // allow additional legacy fields for compatibility
  mealStyle?: MealStyle | null;
  mainArea?: string | null;
  subAreas?: string[];
};

export async function fetchProfile(token?: string | null): Promise<Profile> {
  return apiFetch<Profile>('/api/profile', { token });
}

export async function updateProfile(input: UpdateProfileInput, token?: string | null): Promise<Profile> {
  return apiFetch<Profile>('/api/profile', {
    method: 'PUT',
    data: input,
    token
  });
}

export async function uploadProfileImage(file: File, token?: string | null): Promise<Profile> {
  if (!token) throw new Error('ログインしてください');

  const formData = new FormData();
  formData.append('image', file);
  const url = new URL('/api/profile/image', API_BASE_URL).toString();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    let message = '画像のアップロードに失敗しました';
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore
    }
    throw new ApiError(message, response.status);
  }

  return response.json();
}

export type AvailabilityStatusSummary = {
  availableCount: number;
  required: number;
  meetsRequirement: boolean;
};

export async function fetchAvailabilityStatus(): Promise<AvailabilityStatusSummary> {
  return apiFetch<AvailabilityStatusSummary>('/api/availability/status');
}

export type LikeAnswer = 'YES' | 'NO';

export async function updateLikeStatus(
  targetUserId: string,
  answer: LikeAnswer,
): Promise<void> {
  await apiFetch<void>(`/api/likes/${targetUserId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answer }),
  });
}

export async function deleteMember(userId: string, token?: string | null): Promise<void> {
  await apiFetch<void>(`/api/admin/members/${userId}`, {
    method: 'DELETE',
    token
  });
}

export { API_BASE_URL, SERVER_UNAVAILABLE_MESSAGE };

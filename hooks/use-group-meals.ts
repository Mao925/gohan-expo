'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  ApiError,
  CreateGroupMealPayload,
  GroupMeal,
  GroupMealCandidatesResponse,
  GroupMealInvitationSummary,
  GroupMealMode,
  cancelGroupMealInvitation,
  createGroupMeal,
  deleteGroupMeal,
  fetchGroupMealCandidates,
  fetchGroupMealDetail,
  fetchGroupMeals,
  getGroupMealInvitations,
  inviteGroupMealCandidates,
  joinGroupMeal,
  leaveGroupMeal,
  respondGroupMeal
} from '@/lib/api';

const GROUP_MEALS_QUERY_KEY = ['group-meals'] as const;

export function useGroupMeals(mode: GroupMealMode) {
  const { token } = useAuth();
  return useQuery<GroupMeal[], ApiError>({
    queryKey: [...GROUP_MEALS_QUERY_KEY, mode, token],
    queryFn: () => fetchGroupMeals(token, { mode }),
    enabled: Boolean(token)
  });
}

export function useRealGroupMeals() {
  return useGroupMeals('REAL');
}

export function useMeetGroupMeals() {
  return useGroupMeals('MEET');
}

export function useGroupMealDetail(groupMealId: string) {
  const { token } = useAuth();
  return useQuery<GroupMeal, ApiError>({
    queryKey: ['group-meal', groupMealId, token],
    queryFn: () => fetchGroupMealDetail(groupMealId, token),
    enabled: Boolean(token) && Boolean(groupMealId)
  });
}

export function useGroupMealInvitations(groupMealId: string, options?: { enabled?: boolean }) {
  const { token } = useAuth();

  return useQuery<GroupMealInvitationSummary[], ApiError>({
    queryKey: ['group-meals', groupMealId, 'invitations', token],
    queryFn: () => getGroupMealInvitations(groupMealId, token),
    enabled: Boolean(token) && Boolean(groupMealId) && (options?.enabled ?? true)
  });
}

export function useGroupMealCandidates(groupMealId: string, options?: { enabled?: boolean }) {
  const { token } = useAuth();

  return useQuery<GroupMealCandidatesResponse, ApiError>({
    queryKey: ['group-meals', groupMealId, 'candidates', token],
    queryFn: () => fetchGroupMealCandidates(groupMealId, token),
    enabled: Boolean(token) && Boolean(groupMealId) && (options?.enabled ?? true)
  });
}

export function useInviteGroupMealCandidates(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<GroupMeal, ApiError, string[]>({
    mutationFn: (userIds) => inviteGroupMealCandidates(groupMealId, userIds, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-meals', token] });
      queryClient.invalidateQueries({ queryKey: ['group-meals', groupMealId, 'candidates', token] });
      queryClient.invalidateQueries({ queryKey: ['group-meals', groupMealId, 'invitations', token] });
    }
  });
}

export function useRespondGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, 'ACCEPT' | 'DECLINE'>({
    mutationFn: (action) => respondGroupMeal(groupMealId, action, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-meals', token] });
      queryClient.invalidateQueries({ queryKey: ['group-meal', groupMealId, token] });
    }
  });
}

export function useJoinGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => joinGroupMeal(groupMealId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-meals', token] });
      queryClient.invalidateQueries({ queryKey: ['group-meal', groupMealId, token] });
    }
  });
}

export function useLeaveGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, void>({
    mutationFn: () => leaveGroupMeal(groupMealId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-meals', token] });
      queryClient.invalidateQueries({ queryKey: ['group-meal', groupMealId, token] });
    }
  });
}

export function useDeleteGroupMeal(options?: { mode?: GroupMealMode }) {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (groupMealId) => {
      if (!user?.isAdmin) {
        throw new ApiError('Only admin can delete group meals', 403);
      }
      return deleteGroupMeal(groupMealId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...GROUP_MEALS_QUERY_KEY, token]
      });
      if (options?.mode) {
        queryClient.invalidateQueries({
          queryKey: [...GROUP_MEALS_QUERY_KEY, options.mode, token]
        });
      }
    }
  });
}

export function useCreateGroupMeal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<GroupMeal, ApiError, CreateGroupMealPayload>({
    mutationFn: (payload) => {
      if (!token) {
        throw new ApiError('認証が必要です', 401);
      }
      return createGroupMeal(token, { ...payload, mode: payload.mode ?? 'REAL' });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({
        queryKey: [...GROUP_MEALS_QUERY_KEY, created.mode, token]
      });
    }
  });
}

export function useCancelGroupMealInvitation(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (invitationId) => cancelGroupMealInvitation(invitationId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-meals', groupMealId, 'invitations', token] });
    }
  });
}

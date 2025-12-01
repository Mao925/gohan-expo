'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  fetchGroupMeals,
  createGroupMeal,
  fetchGroupMealCandidates,
  inviteGroupMealCandidates,
  respondGroupMeal,
  joinGroupMeal,
  deleteGroupMeal,
  leaveGroupMeal,
  updateMyGroupMealStatus,
  CreateGroupMealInput,
  GroupMealCandidatesResponse,
  GroupMealParticipantStatus,
  GroupMeal
} from '@/lib/api';

export function useGroupMeals() {
  const { token } = useAuth();

  return useQuery<GroupMeal[]>({
    queryKey: ['groupMeals', token],
    queryFn: () => {
      if (!token) throw new Error('ログインしてください');
      return fetchGroupMeals(token);
    },
    enabled: Boolean(token)
  });
}

export function useCreateGroupMeal() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupMealInput) => {
      if (!token) throw new Error('ログインしてください');
      return createGroupMeal(input, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

export function useGroupMealCandidates(groupMealId: string, options?: { enabled?: boolean }) {
  const { token } = useAuth();

  return useQuery<GroupMealCandidatesResponse>({
    queryKey: ['groupMealCandidates', groupMealId, token],
    queryFn: () => {
      if (!token) throw new Error('ログインしてください');
      return fetchGroupMealCandidates(groupMealId, token);
    },
    enabled: Boolean(groupMealId && token && options?.enabled !== false)
  });
}

export function useInviteGroupMealCandidates(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userIds: string[]) => {
      if (!token) throw new Error('ログインしてください');
      return inviteGroupMealCandidates(groupMealId, userIds, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
      queryClient.invalidateQueries({ queryKey: ['groupMealCandidates', groupMealId, token] });
    }
  });
}

export function useRespondGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: 'ACCEPT' | 'DECLINE') => {
      if (!token) throw new Error('ログインしてください');
      return respondGroupMeal(groupMealId, action, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

export function useJoinGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('ログインしてください');
      return joinGroupMeal(groupMealId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

export function useLeaveGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('ログインしてください');
      return leaveGroupMeal(groupMealId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

export function useDeleteGroupMeal(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!token) throw new Error('ログインしてください');
      return deleteGroupMeal(groupMealId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

export function useUpdateMyGroupMealStatus(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: Extract<GroupMealParticipantStatus, 'JOINED' | 'LATE' | 'CANCELLED'>) => {
      if (!token) throw new Error('ログインしてください');
      return updateMyGroupMealStatus(groupMealId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMeals', token] });
    }
  });
}

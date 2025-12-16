'use client';

import { useCallback, useMemo } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import {
  ApiError,
  fetchGroupMealChatMessages,
  GroupMealChatMessage,
  GroupMealChatMessagesResponse,
  sendGroupMealChatMessage
} from '@/lib/api';

const CHAT_PAGE_SIZE = 30;

export function useGroupMealChat(groupMealId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ['group-meal-chat', groupMealId, token];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery<GroupMealChatMessagesResponse, ApiError>({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchGroupMealChatMessages(
        groupMealId,
        { cursor: pageParam, limit: CHAT_PAGE_SIZE },
        token
      ),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: Boolean(groupMealId) && Boolean(token),
    staleTime: 0
  });

  const messages = useMemo(
    () => data?.pages.flatMap((page) => page.messages) ?? [],
    [data]
  );

  const sendMessageMutation = useMutation<GroupMealChatMessage, ApiError, string>({
    mutationFn: (text) => sendGroupMealChatMessage(groupMealId, text, token),
    onSuccess: (message) => {
      queryClient.setQueryData<InfiniteData<GroupMealChatMessagesResponse>>(queryKey, (previous) => {
        if (!previous || previous.pages.length === 0) {
          return {
            pages: [{ messages: [message], nextCursor: undefined }],
            pageParams: [undefined]
          };
        }
        const lastIndex = previous.pages.length - 1;
        const updatedPages = previous.pages.map((page, index) =>
          index === lastIndex
            ? { ...page, messages: [...page.messages, message] }
            : page
        );
        return {
          ...previous,
          pages: updatedPages
        };
      });
    }
  });

  const sendMessage = useCallback(
    (text: string) => {
      const body = text.trim();
      if (!body) {
        return Promise.resolve();
      }
      return sendMessageMutation.mutateAsync(body);
    },
    [sendMessageMutation]
  );

  return {
    messages,
    loadMore: fetchNextPage,
    hasMore: Boolean(hasNextPage),
    isLoading,
    isFetching,
    isFetchingMore: isFetchingNextPage,
    error,
    refetch,
    sendMessage,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error
  };
}

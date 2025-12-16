'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { ChatMessageBubble } from '@/components/group-meals/chat/ChatMessageBubble';
import { ChatInputBar } from '@/components/group-meals/chat/ChatInputBar';
import { useGroupMealChat } from '@/components/group-meals/chat/useGroupMealChat';
import { CommunityGate } from '@/components/community/community-gate';
import { GroupMealPageGuard } from '@/app/group-meals/[id]/GroupMealPageGuard';
import { useGroupMealDetail } from '@/hooks/use-group-meals';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { ApiError } from '@/lib/api';

export default function GroupMealChatPage({ params }: { params: { id: string } }) {
  return (
    <GroupMealPageGuard>
      <CommunityGate>
        <GroupMealChatPageContent groupMealId={params.id} />
      </CommunityGate>
    </GroupMealPageGuard>
  );
}

type GroupMealChatPageContentProps = {
  groupMealId: string;
};

function GroupMealChatPageContent({ groupMealId }: GroupMealChatPageContentProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [draft, setDraft] = useState('');

  const currentPath = useMemo(() => {
    const base = pathname ?? '/';
    const query = searchParams?.toString();
    return query ? `${base}?${query}` : base;
  }, [pathname, searchParams]);

  const { data: groupMeal, error: detailError } = useGroupMealDetail(groupMealId);
  const {
    messages,
    hasMore,
    loadMore,
    isFetchingMore,
    isFetching,
    error: chatError,
    sendMessage,
    isSending,
    sendError
  } = useGroupMealChat(groupMealId);

  const listRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoadRef = useRef(0);
  const scrollTopBeforeLoadRef = useRef(0);
  const needsScrollRestoreRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const forbiddenToastRef = useRef(false);
  const sendErrorToastRef = useRef(false);

  useEffect(() => {
    if (chatError?.status === 403 && !forbiddenToastRef.current) {
      forbiddenToastRef.current = true;
      toast({
        title: '参加が確定したメンバーだけが利用できます',
        description: '参加を決めたあとに再度アクセスしてください。'
      });
      return;
    }
    if (!chatError) {
      forbiddenToastRef.current = false;
    }
  }, [chatError, toast]);

  useEffect(() => {
    if (sendError && !sendErrorToastRef.current) {
      sendErrorToastRef.current = true;
      toast({
        title: 'メッセージの送信に失敗しました',
        description: sendError.message ?? 'しばらくして再度お試しください。'
      });
      return;
    }
    if (!sendError) {
      sendErrorToastRef.current = false;
    }
  }, [sendError, toast]);

  useEffect(() => {
    if (chatError?.status === 401) {
      router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [chatError, currentPath, router]);

  const handleSendMessage = useCallback(async () => {
    try {
      await sendMessage(draft);
      setDraft('');
    } catch {
      // Error handled via toast/error banner.
    }
  }, [draft, sendMessage]);

  const handleScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      if (target.scrollTop > 120) return;
      if (!hasMore || isFetchingMore) return;
      scrollHeightBeforeLoadRef.current = target.scrollHeight;
      scrollTopBeforeLoadRef.current = target.scrollTop;
      needsScrollRestoreRef.current = true;
      loadMore();
    },
    [hasMore, isFetchingMore, loadMore]
  );

  useEffect(() => {
    if (!needsScrollRestoreRef.current || isFetchingMore) return;
    const list = listRef.current;
    if (!list) return;
    const heightDiff = list.scrollHeight - scrollHeightBeforeLoadRef.current;
    list.scrollTop = heightDiff + scrollTopBeforeLoadRef.current;
    needsScrollRestoreRef.current = false;
  }, [isFetchingMore, messages]);

  useEffect(() => {
    const latestId = messages[messages.length - 1]?.id ?? null;
    const list = listRef.current;
    if (latestId && list && latestId !== lastMessageIdRef.current) {
      if (!needsScrollRestoreRef.current) {
        list.scrollTop = list.scrollHeight;
      }
    }
    lastMessageIdRef.current = latestId;
  }, [messages]);

  const isFatalChatError = Boolean(
    chatError && [403, 404].includes(chatError.status ?? 0)
  );
  const detailApiError = detailError as ApiError | undefined;
  const isFatalDetailError = Boolean(detailApiError && detailApiError.status === 404);
  const fatalErrorMessage = isFatalChatError
    ? chatError?.status === 403
      ? '参加確定後にチャットを利用できます。'
      : 'この箱のチャットは見つかりませんでした。'
    : isFatalDetailError
      ? 'この箱は存在しません。'
      : null;

  const shouldShowChatErrorMessage =
    Boolean(chatError && !isFatalChatError && chatError.status !== 401);
  const shouldShowDetailErrorMessage = Boolean(detailApiError && !isFatalDetailError);
  const nonFatalErrorMessage =
    sendError?.message ??
    (shouldShowChatErrorMessage
      ? chatError?.message ?? 'メッセージの読み込みに失敗しました'
      : null) ??
    (shouldShowDetailErrorMessage ? detailApiError.message : null);

  const isEmptyChat = !isFetching && messages.length === 0;

  if (fatalErrorMessage) {
    return (
      <div className="flex min-h-[100vh] flex-col">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              戻る
            </Button>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Group Meal</p>
              <p className="text-lg font-semibold text-slate-900">チャット</p>
            </div>
            <div className="w-20" aria-hidden />
          </div>
          {groupMeal?.title ? (
            <p className="mt-1 text-sm text-slate-500">{groupMeal.title}</p>
          ) : null}
        </div>
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <ErrorBanner message={fatalErrorMessage} />
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              詳細に戻る
            </Button>
          </div>
        </div>
      );
    }

  return (
    <div className="flex min-h-[100vh] flex-col">
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-slate-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Button>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Group Meal</p>
            <p className="text-lg font-semibold text-slate-900">チャット</p>
            {groupMeal?.title ? (
              <span className="text-sm text-slate-500">{groupMeal.title}</span>
            ) : null}
          </div>
          <div className="w-20" aria-hidden />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 pb-28 pt-4"
        >
          <div className="flex flex-col gap-4">
            {nonFatalErrorMessage ? (
              <ErrorBanner message={nonFatalErrorMessage} />
            ) : null}
            {isFetching && messages.length === 0 ? (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                メッセージを読み込み中です...
              </div>
            ) : null}
            {isFetchingMore ? (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                過去のメッセージを読み込み中...
              </div>
            ) : null}
            {isEmptyChat ? (
              <div className="flex-1 px-2 text-center text-sm text-slate-500">
                まだメッセージはありません。
              </div>
            ) : null}
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isMine={message.sender.id === user?.id}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t bg-white">
        <ChatInputBar
          value={draft}
          onChange={setDraft}
          onSubmit={handleSendMessage}
          isSending={isSending}
        />
      </div>
    </div>
  );
}

'use client';

'use client';

import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/profile-avatar';
import type { GroupMealChatMessage } from '@/lib/api';

type ChatMessageBubbleProps = {
  message: GroupMealChatMessage;
  isMine: boolean;
};

export function ChatMessageBubble({ message, isMine }: ChatMessageBubbleProps) {
  const displayName = message.sender.displayName?.trim() || '名無し';
  const timeLabel = formatMessageTime(message.createdAt);

  return (
    <div className={cn('flex w-full gap-3 px-3', isMine ? 'justify-end' : 'justify-start')}>
      {!isMine ? (
        <ProfileAvatar
          imageUrl={message.sender.avatarUrl ?? undefined}
          name={displayName}
          size="sm"
        />
      ) : (
        <div className="w-8 flex-none" aria-hidden />
      )}
      <div className="max-w-[80%] text-sm">
        {!isMine ? (
          <p className="mb-1 text-xs font-semibold text-slate-500">{displayName}</p>
        ) : null}
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm',
            isMine ? 'bg-brand text-white' : 'bg-slate-100 text-slate-900'
          )}
        >
          <p className="whitespace-pre-line break-words">{message.text}</p>
        </div>
        <div
          className={cn(
            'mt-1 flex items-center gap-2 text-[11px] text-slate-500',
            isMine ? 'justify-end text-right' : ''
          )}
        >
          <span>{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}

function formatMessageTime(value: string) {
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return value;
  }
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useCancelGroupMealInvitation } from '@/hooks/use-group-meals';
import { GroupMealInvitationSummary, InvitationLineStatus } from '@/lib/api';

const STATUS_META: Record<InvitationLineStatus, { label: string; className: string }> = {
  OPENED: { label: '開封済み', className: 'bg-emerald-100 text-emerald-700' },
  SENT_UNOPENED: { label: '未開封', className: 'bg-orange-100 text-orange-700' },
  UNSENT: { label: '送信前', className: 'bg-slate-100 text-slate-600' }
};

const DEFAULT_META = { label: 'ステータス不明', className: 'bg-slate-100 text-slate-500' };

type InvitationListProps = {
  invitations: GroupMealInvitationSummary[];
  groupMealId: string;
};

function formatDateLabel(value: string) {
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date');
    const month = parsed.getMonth() + 1;
    const day = parsed.getDate();
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  } catch {
    return value;
  }
}

function formatTime(value: string) {
  try {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch {
    return value;
  }
}

export function InvitationList({ invitations, groupMealId }: InvitationListProps) {
  const [items, setItems] = useState<GroupMealInvitationSummary[]>(invitations);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const cancelMutation = useCancelGroupMealInvitation(groupMealId);

  useEffect(() => {
    setItems(invitations);
  }, [invitations]);

  const sortedInvitations = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isCanceled === b.isCanceled) {
        return new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime();
      }
      return a.isCanceled ? 1 : -1;
    });
  }, [items]);

  const handleCancel = (invitationId: string) => {
    if (processingId) return;
    setProcessingId(invitationId);
    cancelMutation.mutate(invitationId, {
      onSuccess: () => {
        setItems((prev) =>
          prev.map((item) =>
            item.id === invitationId
              ? {
                  ...item,
                  isCanceled: true,
                  canceledAt: new Date().toISOString()
                }
              : item
          )
        );
        setProcessingId(null);
      },
      onError: () => {
        setProcessingId(null);
      }
    });
  };

  if (sortedInvitations.length === 0) {
    return <p className="text-sm text-slate-500">まだ招待履歴がありません。</p>;
  }

  return (
    <div className="space-y-3">
      {sortedInvitations.map((invitation) => {
        const labelMeta = invitation.isCanceled
          ? { label: 'キャンセル済み', className: 'bg-slate-100 text-slate-500' }
          : STATUS_META[invitation.lineStatus] ?? DEFAULT_META;

        const showLastOpened =
          invitation.lineStatus === 'OPENED' && invitation.lastOpenedAt && !invitation.isCanceled;

        return (
          <div key={invitation.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
            <div className="flex items-start gap-3">
              <ProfileAvatar
                imageUrl={invitation.profileImageUrl ?? undefined}
                name={invitation.name}
                size="sm"
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        invitation.isCanceled ? 'line-through text-slate-400' : 'text-slate-900'
                      )}
                    >
                      {invitation.name}
                    </p>
                    <p className="text-xs text-slate-500">招待日時 {formatDateLabel(invitation.invitedAt)}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                      labelMeta.className
                    )}
                  >
                    {labelMeta.label}
                  </span>
                </div>
                {showLastOpened ? (
                  <p className="mt-1 text-xs text-slate-500">最終閲覧 {formatTime(invitation.lastOpenedAt!)}</p>
                ) : null}
                {invitation.isCanceled && invitation.canceledAt ? (
                  <p className="mt-1 text-xs text-slate-500">
                    キャンセル日時 {formatDateLabel(invitation.canceledAt)}
                  </p>
                ) : null}
              </div>
            </div>
            {!invitation.isCanceled ? (
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="border border-slate-200 text-slate-700 hover:border-slate-300"
                  onClick={() => handleCancel(invitation.id)}
                  disabled={processingId === invitation.id}
                >
                  {processingId === invitation.id ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      キャンセル中...
                    </>
                  ) : (
                    '招待キャンセル'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

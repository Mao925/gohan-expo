'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, Clock3, UserRound, Users } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import {
  useDeleteGroupMeal,
  useGroupMeals,
  useJoinGroupMeal,
  useLeaveGroupMeal,
  useRespondGroupMeal
} from '@/hooks/use-group-meals';
import { ApiError, GroupMeal, formatBudgetLabel } from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';

const statusMeta: Record<GroupMeal['status'], { label: string; className: string }> = {
  OPEN: { label: '募集中', className: 'bg-emerald-100 text-emerald-700' },
  FULL: { label: '満員', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: '終了', className: 'bg-slate-200 text-slate-600' },
  CANCELLED: { label: 'キャンセル', className: 'bg-slate-100 text-slate-600' }
};

const myStatusMeta: Record<NonNullable<GroupMeal['myStatus']>, { label: string; className: string }> = {
  JOINED: { label: '参加中', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  INVITED: { label: '招待中', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  NONE: { label: '未参加', className: 'bg-slate-50 text-slate-600 border border-slate-200' },
  LATE: { label: '遅刻予定', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  CANCELLED: { label: 'キャンセル', className: 'bg-slate-50 text-slate-500 border border-slate-200' }
};

function formatDateLabel(date: string, weekday: GroupMeal['weekday']) {
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date');
    const formatted = parsed.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return `${formatted} (${getWeekdayLabel(weekday)})`;
  } catch {
    return `${date} (${getWeekdayLabel(weekday)})`;
  }
}

export default function GroupMealsPage() {
  return (
    <CommunityGate>
      <GroupMealsContent />
    </CommunityGate>
  );
}

function GroupMealsContent() {
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: groupMeals, isPending, error: groupMealsError, refetch } = useGroupMeals();

  const errorMessage = (groupMealsError as ApiError | undefined)?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">みんなでGO飯</h1>
          <p className="mt-1 text-sm text-slate-600">ランチ / ディナーの箱を作って、仲間を招待しましょう。</p>
        </div>
        <Link href="/group-meals/new">
          <Button size="sm">新しい箱を作る</Button>
        </Link>
      </div>

      <ErrorBanner message={actionError || errorMessage} />

      {isPending ? (
        <Card>
          <p className="text-slate-600">読み込み中...</p>
        </Card>
      ) : errorMessage && !groupMeals ? (
        <Card className="space-y-3">
          <p className="text-slate-700">{errorMessage}</p>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            再読み込み
          </Button>
        </Card>
      ) : !groupMeals || groupMeals.length === 0 ? (
        <Card className="flex flex-col items-start gap-4">
          <h3 className="text-lg font-semibold text-slate-900">まだ箱がありません</h3>
          <p className="text-sm text-slate-600">「新しい箱を作る」から最初の募集を作成しましょう。</p>
          <Link href="/group-meals/new">
            <Button size="sm">新しい箱を作る</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupMeals.map((meal) => (
            <GroupMealCard
              key={meal.id}
              meal={meal}
              currentUserId={user?.id}
              currentUserIsAdmin={user?.isAdmin ?? false}
              onActionError={setActionError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupMealCard({
  meal,
  currentUserId,
  currentUserIsAdmin,
  onActionError
}: {
  meal: GroupMeal;
  currentUserId?: string;
  currentUserIsAdmin?: boolean;
  onActionError?: (message: string | null) => void;
}) {
  const respondMutation = useRespondGroupMeal(meal.id);
  const joinMutation = useJoinGroupMeal(meal.id);
  const deleteMutation = useDeleteGroupMeal(meal.id);
  const leaveMutation = useLeaveGroupMeal(meal.id);
  const isHost = meal.host.userId === currentUserId;
  const canDelete = isHost || currentUserIsAdmin;
  const myStatus = meal.myStatus ?? 'NONE';
  const canLeave = myStatus === 'JOINED' && !isHost;

  const handleRespond = (action: 'ACCEPT' | 'DECLINE') => {
    onActionError?.(null);
    respondMutation.mutate(action, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '操作に失敗しました')
    });
  };

  const handleJoin = () => {
    onActionError?.(null);
    joinMutation.mutate(undefined, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '参加に失敗しました')
    });
  };

  const handleDelete = () => {
    onActionError?.(null);
    if (!window.confirm('この箱を削除しますか？\n参加メンバーの情報も含めて元に戻せません。')) {
      return;
    }
    deleteMutation.mutate(undefined, {
      onError: (err: any) => {
        onActionError?.((err as ApiError | undefined)?.message ?? '削除に失敗しました');
      }
    });
  };

  const handleLeave = () => {
    onActionError?.(null);
    if (!window.confirm('この箱から抜けますか？\n参加枠が空き、他のメンバーが参加できるようになります。')) {
      return;
    }
    leaveMutation.mutate(undefined, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '退出に失敗しました')
    });
  };

  const joinedParticipants = (meal.participants ?? []).filter(
    (participant) => participant && (participant.status === 'JOINED' || participant.status === 'LATE')
  );
  const budgetLabel = formatBudgetLabel(meal.budget);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta[meal.status]?.className ?? 'bg-slate-100 text-slate-600'
              )}
            >
              {statusMeta[meal.status]?.label ?? meal.status}
            </span>
            {myStatus !== 'NONE' ? (
              <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', myStatusMeta[myStatus].className)}>
                {myStatusMeta[myStatus].label}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{meal.title?.trim() || 'タイトルなし'}</h3>
          <p className="text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatDateLabel(meal.date, meal.weekday)}
            </span>
            <span className="ml-3 inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {getTimeSlotLabel(meal.timeSlot)}
            </span>
          </p>
          {meal.meetingPlace && (
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <span className="inline-flex h-4 w-4 items-center justify-center text-[10px]">📍</span>
              <span className="truncate">集合場所：{meal.meetingPlace}</span>
            </div>
          )}
          {budgetLabel && (
            <div className="mt-1">
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                予算：{budgetLabel}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/group-meals/${meal.id}`}>詳細・招待</Link>
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="secondary"
              className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2">
          <UserRound className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-slate-800">{meal.host.name}</span>
          <span className="text-xs text-slate-500">(ホスト)</span>
        </div>
        <div className="flex items-center justify-end gap-3 text-right">
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            {meal.joinedCount} / {meal.capacity}
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            残り {meal.remainingSlots} 枠
          </div>
        </div>
      </div>

      {joinedParticipants.length > 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">参加メンバー</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {joinedParticipants.map((participant) => (
              <span key={participant.userId} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                {participant.user?.profile?.name ?? participant.name ?? '参加者'}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-3">
        {isHost ? (
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">ホストとして参加中</span>
        ) : myStatus === 'INVITED' ? (
          <>
            <Button size="sm" onClick={() => handleRespond('ACCEPT')} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? '参加中...' : '参加する'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleRespond('DECLINE')} disabled={respondMutation.isPending}>
              辞退する
            </Button>
          </>
        ) : myStatus === 'JOINED' ? (
          <>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">参加中</span>
            {canLeave ? (
              <Button size="sm" variant="secondary" onClick={handleLeave} disabled={leaveMutation.isPending}>
                {leaveMutation.isPending ? '退出中...' : '抜ける'}
              </Button>
            ) : null}
          </>
        ) : meal.remainingSlots > 0 && meal.status === 'OPEN' ? (
          <Button size="sm" onClick={handleJoin} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? '参加中...' : '飛び入り参加'}
          </Button>
        ) : (
          <span className="text-sm text-slate-500">参加受付は終了しました</span>
        )}
      </div>
    </Card>
  );
}

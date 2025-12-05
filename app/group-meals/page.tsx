'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarDays, Clock3, Trash2, Users } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/context/auth-context';
import { useMeetGroupMeals, useRealGroupMeals, useJoinGroupMeal, useLeaveGroupMeal, useRespondGroupMeal, useDeleteGroupMeal } from '@/hooks/use-group-meals';
import {
  ApiError,
  GroupMeal,
  GroupMealMode,
  GroupMealParticipantStatus,
  formatBudgetLabel
} from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';

const MODE_TABS: { mode: GroupMealMode; label: string; description: string }[] = [
  { mode: 'REAL', label: 'リアルでGO飯', description: '近場で集まる今日の GO飯 ボックス' },
  { mode: 'MEET', label: 'MeetでGO飯', description: 'オンラインでつながる今日の GO飯 ボックス' }
];

const statusMeta: Record<GroupMeal['status'], { label: string; className: string }> = {
  OPEN: { label: '募集中', className: 'bg-emerald-100 text-emerald-600' },
  FULL: { label: '満員', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: '終了', className: 'bg-slate-100 text-slate-600' }
};

const modeMeta: Record<GroupMealMode, { label: string; className: string }> = {
  REAL: { label: 'リアルでGO飯', className: 'bg-emerald-50 text-emerald-700' },
  MEET: { label: 'MeetでGO飯', className: 'bg-sky-50 text-sky-700' }
};

/**
 * GroupMeal の開催日/時間を numeric timestamp で返す。
 * 日付・時間情報がない場合は 0 を返す（最も古い扱い）。
 */
function getGroupMealTimestamp(meal: GroupMeal): number {
  const date = meal.schedule?.date;
  if (!date) {
    return 0;
  }

  if (meal.schedule?.meetingTimeMinutes != null) {
    const base = new Date(`${date}T00:00:00`).getTime();
    return base + meal.schedule.meetingTimeMinutes * 60 * 1000;
  }

  const timeString = meal.gatherTime ?? meal.schedule?.meetingTime ?? '00:00';
  const dateTime = new Date(`${date}T${timeString}`);
  if (Number.isNaN(dateTime.getTime())) {
    return new Date(`${date}T00:00:00`).getTime();
  }

  return dateTime.getTime();
}

function getMyStatusLabel(status?: GroupMealParticipantStatus | null): string {
  if (!status) return '未定';
  if (status === 'JOINED' || status === 'LATE' || status === 'GO') {
    return '行く✅';
  }
  if (status === 'DECLINED' || status === 'CANCELLED' || status === 'NOT_GO') {
    return '行かない❎';
  }
  return '未定';
}

function GroupMealsPage() {
  return (
    <CommunityGate>
      <GroupMealsContent />
    </CommunityGate>
  );
}

function GroupMealsContent() {
  const { user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const selectedMode = (searchParams.get('mode')?.toUpperCase() as GroupMealMode) ?? 'REAL';
  const realQuery = useRealGroupMeals();
  const meetQuery = useMeetGroupMeals();
  const activeQuery = selectedMode === 'REAL' ? realQuery : meetQuery;
  const groupMeals = activeQuery.data ?? [];
  const isPending = activeQuery.isPending;
  const errorMessage = (activeQuery.error as ApiError | undefined)?.message ?? null;
  const sortedMeals = groupMeals
    .slice()
    .sort((a, b) => getGroupMealTimestamp(a) - getGroupMealTimestamp(b));

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">今日の GO飯</p>
          <h1 className="text-3xl font-semibold text-slate-900">みんなでGO飯</h1>
          <p className="text-sm text-slate-600">
            {MODE_TABS.find((tab) => tab.mode === selectedMode)?.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {MODE_TABS.map((tab) => (
            <Button
              key={tab.mode}
              asChild
              variant={tab.mode === selectedMode ? 'primary' : 'ghost'}
              className="text-sm font-semibold"
            >
              <Link href={`/group-meals?mode=${tab.mode}`}>{tab.label}</Link>
            </Button>
          ))}
          {user?.isAdmin ? (
            <Button size="sm" asChild variant="secondary">
              <Link href="/group-meals/new">新しい箱を作る</Link>
            </Button>
          ) : null}
        </div>
      </header>

      <ErrorBanner message={actionError || errorMessage} />

      {isPending ? (
        <Card>
          <p className="text-slate-600">読み込み中...</p>
        </Card>
      ) : sortedMeals.length === 0 ? (
        <Card className="space-y-3 text-sm text-slate-600">
          <p>このモードではまだ今日の GO飯 がありません。</p>
          <p>空き日程を増やして、GO飯 グループの生成を待ちましょう。</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedMeals.map((meal) => (
            <GroupMealCard
              key={meal.id}
              meal={meal}
              currentUserId={user?.id}
              currentUserIsAdmin={user?.isAdmin ?? false}
              onActionError={(message) => setActionError(message)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type GroupMealCardProps = {
  meal: GroupMeal;
  currentUserId?: string;
  currentUserIsAdmin?: boolean;
  onActionError?: (message: string | null) => void;
};

function GroupMealCard({ meal, currentUserId, currentUserIsAdmin, onActionError }: GroupMealCardProps) {
  const respondMutation = useRespondGroupMeal(meal.id);
  const joinMutation = useJoinGroupMeal(meal.id);
  const leaveMutation = useLeaveGroupMeal(meal.id);
  const deleteMutation = useDeleteGroupMeal({ mode: meal.mode });
  const isHost = meal.host.userId === currentUserId;
  const canDelete = isHost || currentUserIsAdmin;
  const myParticipant = meal.participants.find((participant) => participant.userId === currentUserId);
  const fallbackStatus =
    meal.myStatus && meal.myStatus !== 'NONE' ? (meal.myStatus as GroupMealParticipantStatus) : undefined;
  const myParticipantStatus = myParticipant?.status ?? fallbackStatus;
  const isPendingParticipant = myParticipantStatus === 'PENDING';
  const isGoing =
    myParticipantStatus === 'JOINED' || myParticipantStatus === 'LATE' || myParticipantStatus === 'GO';
  const canRespond = !isHost && (isPendingParticipant || myParticipantStatus === 'INVITED');
  const canLeave = !isHost && isGoing;
  const canJoinAsGuest = !isHost && !myParticipant && meal.status === 'OPEN' && meal.remainingSlots > 0;
  const handleDelete = () => {
    if (!window.confirm('この箱を削除しますか？この操作は元に戻せません。')) {
      return;
    }
    onActionError?.(null);
    deleteMutation.mutate(meal.id, {
      onError: (err: any) =>
        onActionError?.((err as ApiError | undefined)?.message ?? '箱の削除に失敗しました')
    });
  };

  const defaultTimeBand = meal.timeSlot === 'DAY' ? 'LUNCH' : 'DINNER';
  const schedule = meal.schedule ?? {
    date: meal.date,
    timeBand: defaultTimeBand,
    meetingTime: null,
    meetingTimeMinutes: null,
    place: null
  };
  const formattedDate = formatDateLabel(schedule.date, meal.weekday);
  const timeBandLabel = schedule.timeBand === 'LUNCH' ? '昼' : '夜';
  const meetingTimeLabel = schedule.meetingTime;
  const meetingPlaceName = schedule.place?.name ?? meal.meetingPlace;
  const meetingPlaceAddress = schedule.place?.address;
  const budgetLabel = formatBudgetLabel(meal.budget);
  const talkTopics = meal.talkTopics ?? [];

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

  const handleLeave = () => {
    onActionError?.(null);
    if (!window.confirm('この箱から抜けますか？')) {
      return;
    }
    leaveMutation.mutate(undefined, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '退出に失敗しました')
    });
  };

  const hostUserId = meal.host.userId;
  const nonHostParticipants = meal.participants.filter((participant) => participant.userId !== hostUserId);
  const participantPreview = nonHostParticipants.slice(0, 3);
  const additionalParticipantCount = Math.max(nonHostParticipants.length - participantPreview.length, 0);

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta[meal.status]?.className ?? 'bg-slate-100 text-slate-600'
              )}
            >
              {statusMeta[meal.status]?.label ?? meal.status}
            </span>
            <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', modeMeta[meal.mode].className)}>
              {modeMeta[meal.mode].label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {myParticipant ? getMyStatusLabel(myParticipantStatus) : '未定'}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900">{meal.title || 'タイトルなし'}</h3>
          <p className="text-sm text-slate-500">
            <CalendarDays className="inline h-4 w-4 text-slate-400" />
            <span className="ml-2">{formattedDate}</span>
            <span className="ml-4 flex items-center gap-1">
              <Clock3 className="h-4 w-4 text-slate-400" />
              <span>
                {timeBandLabel} {meetingTimeLabel ? `/${meetingTimeLabel}` : ''}
              </span>
            </span>
          </p>
          {meal.mode === 'REAL' ? (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">集合場所:</span>{' '}
              {meetingPlaceName ?? '未設定'}
            </p>
          ) : meetingPlaceName ? (
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">集合場所:</span> {meetingPlaceName}
            </p>
          ) : null}
          {meetingPlaceAddress ? (
            <p className="text-xs text-slate-500">住所: {meetingPlaceAddress}</p>
          ) : null}
          <p className="text-xs text-slate-500">
            定員: {meal.capacity.toLocaleString()}人
          </p>
          {meal.mode === 'REAL' ? (
            <p className="text-xs text-slate-500">
              <span className="font-semibold text-slate-900">予算:</span> {budgetLabel ?? '未設定'}
            </p>
          ) : budgetLabel ? (
            <p className="text-xs text-slate-500">予算: {budgetLabel}</p>
          ) : null}
          {talkTopics.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {talkTopics.map((topic) => (
                <span key={topic} className="rounded-full border border-slate-200 px-2 py-0.5">
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/group-meals/${meal.id}`}>詳細</Link>
          </Button>
          {currentUserIsAdmin ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              aria-label="この箱を削除する"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : null}
          {canDelete ? (
            <Button size="sm" variant="ghost" disabled>
              管理者
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">参加者</p>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <ProfileAvatar
              imageUrl={meal.host.profileImageUrl ?? undefined}
              name={meal.host.name}
              size="sm"
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-slate-900">{meal.host.name}</span>
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">主催者</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            <span>
              参加メンバー: {meal.joinedCount.toLocaleString()} / {meal.capacity.toLocaleString()}人
            </span>
            <span>{meal.remainingSlots > 0 ? `残り${meal.remainingSlots.toLocaleString()}枠` : '満席'}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {participantPreview.map((participant) => (
              <div
                key={participant.userId}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm"
              >
                <ProfileAvatar
                  imageUrl={participant.profileImageUrl ?? undefined}
                  name={participant.name}
                  size="sm"
                />
                <span>{participant.name}</span>
              </div>
            ))}
            {additionalParticipantCount > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                他 {additionalParticipantCount} 名
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isHost ? (
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">ホスト</span>
        ) : canRespond ? (
          <>
            <Button size="sm" onClick={() => handleRespond('ACCEPT')} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? '参加中...' : '参加する'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleRespond('DECLINE')} disabled={respondMutation.isPending}>
              辞退する
            </Button>
          </>
        ) : canLeave ? (
          <>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">参加中</span>
            <Button size="sm" variant="secondary" onClick={handleLeave} disabled={leaveMutation.isPending}>
              {leaveMutation.isPending ? '退出中...' : '抜ける'}
            </Button>
          </>
        ) : canJoinAsGuest ? (
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

export default GroupMealsPage;

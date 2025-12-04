'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Clock3, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/context/auth-context';
import {
  useGroupMealCandidates,
  useGroupMealDetail,
  useGroupMealInvitations,
  useInviteGroupMealCandidates,
  useJoinGroupMeal,
  useLeaveGroupMeal,
  useRespondGroupMeal,
  useDeleteGroupMeal
} from '@/hooks/use-group-meals';
import { ApiError, GroupMeal, GroupMealCandidate, GroupMealParticipantStatus, formatBudgetLabel } from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';
import { InvitationList } from './InvitationList';
import { InvitationOpenTracker } from './InvitationOpenTracker';

const MODE_DESCRIPTIONS: Record<'REAL' | 'MEET', string> = {
  REAL: 'リアルで近場に集まる今日の GO飯。持ち物と参加目標を確認して、さっと集合！',
  MEET: 'オンラインでつながる MeetでGO飯。Zoom 等のリンクから参加できます。'
};

function myStatusLabel(status?: GroupMealParticipantStatus | null) {
  if (!status) return '未定';
  if (status === 'JOINED' || status === 'LATE' || status === 'GO') return '行く✅';
  if (status === 'DECLINED' || status === 'CANCELLED' || status === 'NOT_GO') return '行かない❎';
  return '未定';
}

export default function GroupMealDetailPage({ params }: { params: { id: string } }) {
  return (
    <CommunityGate>
      <GroupMealDetailContent params={params} />
    </CommunityGate>
  );
}

function GroupMealDetailContent({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: groupMeal, isPending, error } = useGroupMealDetail(params.id);
  const invitationId = searchParams.get('invitationId') ?? undefined;

  const respondMutation = useRespondGroupMeal(params.id);
  const joinMutation = useJoinGroupMeal(params.id);
  const leaveMutation = useLeaveGroupMeal(params.id);
  const inviteMutation = useInviteGroupMealCandidates(params.id);
  const deleteMutation = useDeleteGroupMeal({ mode: groupMeal?.mode });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const isHost = Boolean(groupMeal && user && user.id === groupMeal.host.userId);

  const { data: invitations, isPending: invitationsPending } = useGroupMealInvitations(params.id, {
    enabled: Boolean(isHost)
  });
  const { data: candidatesData, isPending: candidatesPending, error: candidatesError } = useGroupMealCandidates(
    params.id,
    { enabled: Boolean(isHost) }
  );
  useEffect(() => {
    if (!candidatesData) return;
    setSelectedUserIds((prev) =>
      prev.filter((id) => candidatesData.candidates.some((candidate) => candidate.userId === id))
    );
  }, [candidatesData]);

  const myParticipant = useMemo(() => {
    if (!groupMeal || !user) return null;
    return groupMeal.participants.find((participant) => participant.userId === user.id);
  }, [groupMeal, user]);

  const myParticipantStatus = myParticipant?.status ?? null;
  const canRespondAsInvitee =
    Boolean(myParticipant) && (myParticipantStatus === 'INVITED' || myParticipantStatus === 'PENDING');
  const canLeaveAsParticipant = Boolean(myParticipant) && ['JOINED', 'LATE', 'GO'].includes(myParticipantStatus ?? '');
  const canJoinAsGuest = Boolean(groupMeal && !isHost && !myParticipant && groupMeal.status === 'OPEN' && groupMeal.remainingSlots > 0);

  const handleRespond = (action: 'ACCEPT' | 'DECLINE') => {
    setActionError(null);
    respondMutation.mutate(action, {
      onError: (err: any) => setActionError((err as ApiError | undefined)?.message ?? '操作に失敗しました')
    });
  };

  const handleJoin = () => {
    setActionError(null);
    joinMutation.mutate(undefined, {
      onError: (err: any) => setActionError((err as ApiError | undefined)?.message ?? '参加に失敗しました')
    });
  };

  const handleLeave = () => {
    if (!window.confirm('この箱から抜けますか？')) return;
    setActionError(null);
    leaveMutation.mutate(undefined, {
      onError: (err: any) => setActionError((err as ApiError | undefined)?.message ?? '退出に失敗しました')
    });
  };

  const handleDelete = () => {
    if (!groupMeal) return;
    if (!window.confirm('この箱を削除しますか？この操作は元に戻せません。')) return;
    setActionError(null);
    deleteMutation.mutate(groupMeal.id, {
      onSuccess: () => {
        router.push(`/group-meals?mode=${groupMeal.mode}`);
      },
      onError: (err: any) => setActionError((err as ApiError | undefined)?.message ?? '箱の削除に失敗しました')
    });
  };

  const handleToggle = (userId: string) => {
    setActionError(null);
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleInvite = () => {
    if (selectedUserIds.length === 0) {
      setActionError('招待するメンバーを選択してください');
      return;
    }
    setActionError(null);
    inviteMutation.mutate(selectedUserIds, {
      onSuccess: () => {
        setSelectedUserIds([]);
      },
      onError: (err: any) => setActionError((err as ApiError | undefined)?.message ?? '招待に失敗しました')
    });
  };

  if (isPending) {
    return (
      <Card>
        <p className="text-slate-600">読み込み中...</p>
      </Card>
    );
  }

  if (error && !groupMeal) {
    const errorMessage = (error as ApiError | undefined)?.message ?? '読み込みに失敗しました';
    return (
      <Card className="space-y-3">
        <p className="text-slate-700">{errorMessage}</p>
        <Button variant="ghost" asChild size="sm">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </Card>
    );
  }

  if (!groupMeal) {
    return (
      <Card className="space-y-3">
        <p className="text-slate-700">指定された GO飯 が見つかりませんでした。</p>
        <Button variant="ghost" asChild size="sm">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </Card>
    );
  }

  const defaultTimeBand = groupMeal.timeSlot === 'DAY' ? 'LUNCH' : 'DINNER';
  const schedule = groupMeal.schedule ?? {
    date: groupMeal.date,
    timeBand: defaultTimeBand,
    meetingTime: null,
    meetingTimeMinutes: null,
    place: null
  };
  const formattedDate = formatDateLabel(schedule.date, groupMeal.weekday);
  const timeBandLabel = schedule.timeBand === 'LUNCH' ? '昼' : '夜';
  const meetingTimeLabel = schedule.meetingTime ?? null;
  const meetingPlaceName = schedule.place?.name ?? groupMeal.meetingPlace;
  const meetingPlaceAddress = schedule.place?.address;
  const budgetLabel = formatBudgetLabel(groupMeal.budget);

  const candidates = candidatesData?.candidates ?? [];
  const availableCandidates = candidates.filter((candidate) => candidate.isAvailableForSlot);
  const unavailableCandidates = candidates.filter((candidate) => !candidate.isAvailableForSlot);
  const candidatesErrorMessage = (candidatesError as ApiError | undefined)?.message ?? null;
  const detailErrorMessage = (error as ApiError | undefined)?.message ?? null;

  return (
    <div className="space-y-6">
      {invitationId ? <InvitationOpenTracker invitationId={invitationId} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Group Meal</p>
          <h1 className="text-3xl font-semibold text-slate-900">{groupMeal.title || 'タイトルなし'}</h1>
          <p className="mt-1 text-sm text-slate-600">{MODE_DESCRIPTIONS[groupMeal.mode]}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/group-meals?mode=REAL">一覧に戻る</Link>
          </Button>
          {user?.isAdmin ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              <span>削除</span>
            </Button>
          ) : null}
        </div>
      </div>

      <ErrorBanner message={actionError || detailErrorMessage || candidatesErrorMessage} />

      <Card className="space-y-4">
        <div className="flex flex-col gap-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-slate-400" />
            <span className="font-semibold text-slate-900">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-slate-400" />
            <span>
              {timeBandLabel}
              {meetingTimeLabel ? ` / ${meetingTimeLabel}` : ''}
            </span>
          </div>
          {meetingPlaceName ? (
            <p>
              <span className="font-semibold text-slate-900">集合場所:</span> {meetingPlaceName}
            </p>
          ) : null}
          {meetingPlaceAddress ? <p className="text-xs text-slate-500">住所: {meetingPlaceAddress}</p> : null}
          {budgetLabel ? <p className="text-xs text-slate-500">予算: {budgetLabel}</p> : null}
          {groupMeal.meetUrl && groupMeal.mode === 'MEET' ? (
            <Button asChild size="sm">
              <Link href={groupMeal.meetUrl} target="_blank" rel="noreferrer">
                当日の Meet リンクを開く
              </Link>
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">あなたの参加状況</h2>
            <p className="text-xs text-slate-500">ここから「行く / 辞退する / 退出する」を操作できます。</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isHost ? (
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                ホストとして参加中
              </span>
            ) : canRespondAsInvitee ? (
              <>
                <Button size="sm" onClick={() => handleRespond('ACCEPT')} disabled={respondMutation.isPending}>
                  {respondMutation.isPending ? '参加中...' : '行く'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleRespond('DECLINE')}
                  disabled={respondMutation.isPending}
                >
                  辞退する
                </Button>
              </>
            ) : canLeaveAsParticipant ? (
              <>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  {myStatusLabel(myParticipantStatus)}
                </span>
                <Button size="sm" variant="secondary" onClick={handleLeave} disabled={leaveMutation.isPending}>
                  {leaveMutation.isPending ? '退出中...' : '退出する'}
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
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">参加メンバー</h2>
          <span className="text-sm text-slate-500">{groupMeal.participants.length} 名</span>
        </div>
        {groupMeal.participants.length === 0 ? (
          <p className="text-sm text-slate-600">まだメンバーがいません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groupMeal.participants.map((participant) => (
              <div
                key={participant.userId}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ProfileAvatar imageUrl={participant.profileImageUrl ?? undefined} name={participant.name} size="sm" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{participant.name}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                          {myStatusLabel(participant.status)}
                        </span>
                      </div>
                      <FavoriteMealsList meals={participant.favoriteMeals} variant="pill" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">{renderParticipantStatusBadge(participant.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isHost ? (
        <>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">招待候補</h2>
              <span className="text-sm text-slate-500">{candidates.length} 名</span>
            </div>
            {candidatesPending ? (
              <p className="text-sm text-slate-600">候補を読み込み中...</p>
            ) : candidates.length === 0 ? (
              <p className="text-sm text-slate-600">招待できるメンバーがまだいません。</p>
            ) : (
              <div className="space-y-6">
                {availableCandidates.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-emerald-600">日程が合っているメンバー</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {availableCandidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.userId}
                          candidate={candidate}
                          highlight
                          groupMealBudget={groupMeal.budget}
                          checked={selectedUserIds.includes(candidate.userId)}
                          onToggle={() => handleToggle(candidate.userId)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {unavailableCandidates.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">日程が合っていないメンバー</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {unavailableCandidates.map((candidate) => (
                        <CandidateCard
                          key={candidate.userId}
                          candidate={candidate}
                          groupMealBudget={groupMeal.budget}
                          checked={selectedUserIds.includes(candidate.userId)}
                          onToggle={() => handleToggle(candidate.userId)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedUserIds([])}
                    disabled={inviteMutation.isPending}
                  >
                    クリア
                  </Button>
                  <Button onClick={handleInvite} disabled={inviteMutation.isPending || selectedUserIds.length === 0}>
                    {inviteMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        招待中...
                      </>
                    ) : (
                      `選択したメンバーを招待 (${selectedUserIds.length})`
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">招待状況</h2>
              <span className="text-sm text-slate-500">{invitations?.length ?? 0} 名</span>
            </div>
            {invitationsPending ? (
              <p className="text-sm text-slate-600">招待状況を読み込み中...</p>
            ) : (
              <InvitationList invitations={invitations ?? []} groupMealId={groupMeal.id} />
            )}
          </Card>
        </>
      ) : null}
    </div>
  );
}

type CandidateCardProps = {
  candidate: GroupMealCandidate;
  highlight?: boolean;
  groupMealBudget: GroupMeal['budget'] | null;
  checked: boolean;
  onToggle: () => void;
};

function CandidateCard({
  candidate,
  highlight,
  groupMealBudget,
  checked,
  onToggle
}: CandidateCardProps) {
  const locationLabel = candidate.profile?.mainArea;
  const subAreas = candidate.profile?.subAreas ?? [];
  const favoriteMeals = candidate.profile?.favoriteMeals ?? candidate.favoriteMeals ?? [];
  const budgetMatches = groupMealBudget && candidate.profile?.defaultBudget === groupMealBudget;

  return (
    <SurfaceCard
      className={cn(
        'cursor-pointer px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-lg',
        highlight && 'border-emerald-200 bg-emerald-50',
        checked && 'ring-2 ring-[var(--brand)]'
      )}
    >
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--brand)]" checked={checked} onChange={onToggle} />
        <ProfileAvatar imageUrl={candidate.profileImageUrl ?? undefined} name={candidate.name} size="sm" />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-900">{candidate.name}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                highlight ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
              )}
            >
              {highlight ? '日程が合う' : '今回は日程が合っていません'}
            </span>
            {budgetMatches ? (
              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700">
                予算一致
              </span>
            ) : null}
          </div>
          {locationLabel ? <p className="text-xs text-slate-500">{locationLabel}</p> : null}
          {subAreas.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {subAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
          <FavoriteMealsList meals={favoriteMeals} variant="pill" />
        </div>
      </label>
    </SurfaceCard>
  );
}

function renderParticipantStatusBadge(status: GroupMealParticipantStatus) {
  switch (status) {
    case 'JOINED':
    case 'GO':
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          参加
        </span>
      );
    case 'LATE':
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
          遅刻予定
        </span>
      );
    case 'CANCELLED':
    case 'NOT_GO':
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          辞退
        </span>
      );
    case 'INVITED':
    case 'PENDING':
      return (
        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
          招待済み
        </span>
      );
    case 'DECLINED':
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          辞退
        </span>
      );
    default:
      return null;
  }
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

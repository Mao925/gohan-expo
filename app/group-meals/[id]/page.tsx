'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Clock3, Loader2, ShieldCheck, Users } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAuth } from '@/context/auth-context';
import {
  useGroupMeals,
  useGroupMealCandidates,
  useInviteGroupMealCandidates,
  useGroupMealInvitations
} from '@/hooks/use-group-meals';
import { ApiError, GroupMeal, GroupMealCandidate, GroupMealParticipantStatus, formatBudgetLabel } from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';
import {
  DRINKING_STYLE_LABELS,
  MEAL_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS
} from '@/lib/profile-labels';
import { InvitationList } from './InvitationList';
import { InvitationOpenTracker } from './InvitationOpenTracker';

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

const statusMeta: Record<GroupMeal['status'], { label: string; className: string }> = {
  OPEN: { label: '募集中', className: 'bg-emerald-100 text-emerald-700' },
  FULL: { label: '満員', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: '終了', className: 'bg-slate-200 text-slate-600' },
  CANCELLED: { label: 'キャンセル', className: 'bg-slate-100 text-slate-600' }
};

export default function GroupMealDetailPage({ params }: { params: { id: string } }) {
  return (
    <CommunityGate>
      <GroupMealDetailContent params={params} />
    </CommunityGate>
  );
}

function GroupMealDetailContent({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: groupMeals, isPending, error: groupMealsError } = useGroupMeals();
  const searchParams = useSearchParams();

  const groupMeal = useMemo(
    () => groupMeals?.find((meal) => meal.id === params.id) ?? null,
    [groupMeals, params.id]
  );
  const isHost = Boolean(groupMeal && user?.id === groupMeal.host.userId);
  const invitationId = searchParams.get('invitationId') ?? undefined;
  const {
    data: invitations,
    isPending: invitationsPending
  } = useGroupMealInvitations(params.id, { enabled: Boolean(isHost) });
  const {
    data: candidatesData,
    isPending: candidatesPending,
    error: candidatesError
  } = useGroupMealCandidates(params.id, { enabled: Boolean(isHost) });

  const inviteMutation = useInviteGroupMealCandidates(params.id);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!groupMeals || isPending) return;
    if (!groupMeal) {
      router.replace('/group-meals');
    }
  }, [groupMeal, groupMeals, isPending, router]);

  useEffect(() => {
    if (!candidatesData) return;
    setSelectedUserIds((prev) =>
      prev.filter((id) => candidatesData.candidates.some((candidate) => candidate.userId === id))
    );
  }, [candidatesData]);

  if (isPending) {
    return (
      <Card>
        <p className="text-slate-600">読み込み中...</p>
      </Card>
    );
  }

  const groupMealsErrorMessage = (groupMealsError as ApiError | undefined)?.message ?? null;

  if (groupMealsErrorMessage && !groupMeal) {
    return (
      <Card className="space-y-3">
        <p className="text-slate-700">{groupMealsErrorMessage}</p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </Card>
    );
  }

  if (!groupMeal) {
    return (
      <Card className="space-y-3">
        <p className="text-slate-700">指定された箱が見つかりませんでした。</p>
        <Button asChild size="sm" variant="secondary">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </Card>
    );
  }

  const candidatesErrorMessage = (candidatesError as ApiError | undefined)?.message ?? null;
  const joinedParticipants = groupMeal.participants.filter((p) => p.status === 'JOINED');
  const hostInParticipants = joinedParticipants.some((p) => p.isHost);
  const participantCount = joinedParticipants.length + (hostInParticipants ? 0 : 1);
  const remainingSlots = Math.max(groupMeal.capacity - participantCount, 0);
  const budgetLabel = formatBudgetLabel(groupMeal.budget);
  const scheduleDate = groupMeal.schedule?.date ?? groupMeal.date;
  const timeBandLabel =
    groupMeal.schedule?.timeBand === 'LUNCH'
      ? '昼'
      : groupMeal.schedule?.timeBand === 'DINNER'
        ? '夜'
        : getTimeSlotLabel(groupMeal.timeSlot);
  const meetingTimeLabel = groupMeal.schedule?.meetingTime ?? null;
  const meetingPlaceName = groupMeal.schedule?.place?.name ?? groupMeal.meetingPlace;
  const meetingPlaceAddress = groupMeal.schedule?.place?.address ?? null;

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

  return (
    <div className="space-y-6">
      {invitationId ? <InvitationOpenTracker invitationId={invitationId} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Group Meal</p>
          <h1 className="text-3xl font-semibold text-slate-900">
            {groupMeal.title?.trim() || 'タイトルなし'}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta[groupMeal.status]?.className
              )}
            >
              {statusMeta[groupMeal.status]?.label ?? groupMeal.status}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-800">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatDateLabel(groupMeal.date, groupMeal.weekday)}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-800">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {getTimeSlotLabel(groupMeal.timeSlot)}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p className="text-sm font-semibold text-slate-900">
              {formatDateLabel(scheduleDate, groupMeal.weekday)} {timeBandLabel}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">集合時間:</span>{' '}
              {meetingTimeLabel ?? '集合時間は未設定です'}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-medium text-slate-900">集合場所:</span>{' '}
              {meetingPlaceName ?? '集合場所は未設定です'}
            </p>
            <p className="text-xs text-slate-500">
              {meetingPlaceAddress ? `住所: ${meetingPlaceAddress}` : '住所は未設定です'}
            </p>
            {budgetLabel && (
              <div className="flex items-center gap-2">
                <span>💰 予算の目安</span>
                <span className="font-medium">{budgetLabel}</span>
              </div>
            )}
          </div>
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </div>

      <ErrorBanner message={actionError || groupMealsErrorMessage || candidatesErrorMessage} />

      <Card className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3">
            <ProfileAvatar
              imageUrl={groupMeal.host.profileImageUrl}
              name={groupMeal.host.name}
              size="md"
              className="flex-shrink-0"
            />
            <div>
              <p className="text-xs uppercase tracking-wide text-orange-600">ホスト</p>
              <p className="text-base font-semibold text-slate-900">{groupMeal.host.name}</p>
            </div>
          </div>
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <Users className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">定員 / 参加</p>
                <p className="text-base font-semibold text-slate-900">
                  {participantCount} / {groupMeal.capacity}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-xs uppercase tracking-wide text-emerald-600">残り枠</p>
                <p className="text-base font-semibold text-emerald-800">{remainingSlots}</p>
              </div>
            </div>
        </div>
      </Card>


      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">参加メンバー</h2>
          <span className="text-sm text-slate-500">{participantCount} 名</span>
        </div>
        {participantCount === 0 ? (
          <p className="text-sm text-slate-600">まだ参加者はいません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groupMeal.participants.map((participant) => {
              const profile = participant.user?.profile;
              const name = profile?.name ?? participant.name ?? '参加者';
              const favoriteMeals = profile?.favoriteMeals ?? participant.favoriteMeals ?? [];
              const avatarUrl = profile?.profileImageUrl ?? participant.profileImageUrl ?? undefined;
              const isHostParticipant = participant.isHost || participant.userId === groupMeal.host.userId;
              const displayedStatus = participant.status;
              const locationLabel = profile?.mainArea;
              const subAreas = profile?.subAreas ?? [];
              const budgetLabel = profile?.defaultBudget ? formatBudgetLabel(profile.defaultBudget) : null;
              const drinkingLabel = profile?.drinkingStyle ? DRINKING_STYLE_LABELS[profile.drinkingStyle] : null;
              const mealStyleLabel = profile?.mealStyle ? MEAL_STYLE_LABELS[profile.mealStyle] : null;
              const frequencyLabel = profile?.goMealFrequency ? GO_MEAL_FREQUENCY_LABELS[profile.goMealFrequency] : null;
              const preferenceBadges = [budgetLabel, drinkingLabel, mealStyleLabel, frequencyLabel].filter(
                Boolean
              ) as string[];
              const bio = profile?.bio;

              return (
                <div key={participant.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ProfileAvatar imageUrl={avatarUrl} name={name} size="sm" className="flex-shrink-0" />
                      <div className="flex flex-1 flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{name}</span>
                          {isHostParticipant ? (
                            <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                              ホスト
                            </span>
                          ) : null}
                        </div>
                        {locationLabel ? (
                          <p className="text-xs text-slate-500">{locationLabel}</p>
                        ) : null}
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
                        {preferenceBadges.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            {preferenceBadges.map((badge) => (
                              <span
                                key={badge}
                                className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-600"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        )}
                        <FavoriteMealsList meals={favoriteMeals} className="mt-0" />
                        {bio ? <p className="text-xs text-slate-500">{bio}</p> : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">{renderParticipantStatusBadge(displayedStatus)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {isHost ? (
        <>
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">招待候補</h2>
              <span className="text-sm text-slate-500">{candidatesData?.candidates.length ?? 0} 名</span>
            </div>
            {candidatesPending ? (
              <p className="text-sm text-slate-600">候補を読み込み中...</p>
            ) : !candidatesData ? (
              <p className="text-sm text-slate-600">招待可能なメンバーがいません。</p>
            ) : (
              (() => {
                const candidates = candidatesData.candidates ?? [];
                const availableCandidates = candidates.filter((c) => c.isAvailableForSlot);
                const unavailableCandidates = candidates.filter((c) => !c.isAvailableForSlot);

                return candidates.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    まだ招待できるメンバーがいません。他のメンバーがコミュニティに参加すると表示されます。
                  </p>
                ) : (
                  <div className="space-y-6">
                    {availableCandidates.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-emerald-600">この箱の日程と合っているメンバー</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {availableCandidates.map((candidate) => (
                            <CandidateCard
                              key={candidate.userId}
                              candidate={candidate}
                              highlight
                              checked={selectedUserIds.includes(candidate.userId)}
                              onToggle={() => handleToggle(candidate.userId)}
                              groupMealBudget={groupMeal.budget}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {unavailableCandidates.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500">今回の日程とは合っていないメンバー</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {unavailableCandidates.map((candidate) => (
                            <CandidateCard
                              key={candidate.userId}
                              candidate={candidate}
                              highlight={false}
                              checked={selectedUserIds.includes(candidate.userId)}
                              onToggle={() => handleToggle(candidate.userId)}
                              groupMealBudget={groupMeal.budget}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()
            )}
            <div className="flex flex-wrap items-center justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setSelectedUserIds([])} disabled={inviteMutation.isPending}>
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
  checked: boolean;
  onToggle: () => void;
  groupMealBudget: GroupMeal['budget'] | null;
};

function CandidateCard({
  candidate,
  highlight,
  checked,
  onToggle,
  groupMealBudget
}: CandidateCardProps) {
  const profile = candidate.profile ?? null;
  const favoriteMeals = profile?.favoriteMeals ?? candidate.favoriteMeals ?? [];
  const locationLabel = profile?.mainArea;
  const subAreas = profile?.subAreas ?? [];
  const budgetLabel = profile?.defaultBudget ? formatBudgetLabel(profile.defaultBudget) : null;
  const drinkingLabel = profile?.drinkingStyle ? DRINKING_STYLE_LABELS[profile.drinkingStyle] : null;
  const mealStyleLabel = profile?.mealStyle ? MEAL_STYLE_LABELS[profile.mealStyle] : null;
  const frequencyLabel = profile?.goMealFrequency ? GO_MEAL_FREQUENCY_LABELS[profile.goMealFrequency] : null;
  const preferenceBadges = [budgetLabel, drinkingLabel, mealStyleLabel, frequencyLabel].filter(
    Boolean
  ) as string[];
  const budgetMatches = groupMealBudget && profile?.defaultBudget === groupMealBudget;

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
        <ProfileAvatar
          imageUrl={candidate.profileImageUrl}
          name={candidate.name}
          size="sm"
          className="flex-shrink-0"
        />
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-strong)]">{candidate.name}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                highlight ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-[var(--text-muted)]'
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
                <span key={area} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {area}
                </span>
              ))}
            </div>
          )}
          <FavoriteMealsList meals={favoriteMeals} variant="pill" />
          {preferenceBadges.length > 0 && (
            <div className="flex flex-wrap gap-2 text-[11px]">
              {preferenceBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 px-2 py-0.5 font-semibold text-slate-600"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      </label>
    </SurfaceCard>
  );
}

function renderParticipantStatusBadge(status: GroupMealParticipantStatus) {
  switch (status) {
    case 'JOINED':
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
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          キャンセル
        </span>
      );
    case 'INVITED':
      return (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
          招待中
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

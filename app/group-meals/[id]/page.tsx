'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock3, Loader2, ShieldCheck, Users, UserRound } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SurfaceCard } from '@/components/ui/surface-card';
import { useAuth } from '@/context/auth-context';
import { useGroupMeals, useGroupMealCandidates, useInviteGroupMealCandidates } from '@/hooks/use-group-meals';
import { ApiError, GroupMeal, GroupMealCandidate } from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';

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
  CLOSED: { label: '終了', className: 'bg-slate-200 text-slate-600' }
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

  const groupMeal = useMemo(
    () => groupMeals?.find((meal) => meal.id === params.id) ?? null,
    [groupMeals, params.id]
  );
  const isHost = Boolean(groupMeal && user?.id === groupMeal.host.userId);

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

  const joinedParticipants = groupMeal.participants.filter(
    (participant) => participant.status === 'JOINED' || participant.isHost
  );

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
        </div>
        <Button asChild size="sm" variant="secondary">
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </div>

      <ErrorBanner message={actionError || groupMealsErrorMessage || candidatesErrorMessage} />

      <Card className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl bg-orange-50 px-4 py-3">
            <UserRound className="h-5 w-5 text-orange-500" />
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
                {groupMeal.joinedCount} / {groupMeal.capacity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-wide text-emerald-600">残り枠</p>
              <p className="text-base font-semibold text-emerald-800">{groupMeal.remainingSlots}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">参加メンバー</h2>
          <span className="text-sm text-slate-500">{joinedParticipants.length} 名</span>
        </div>
        {joinedParticipants.length === 0 ? (
          <p className="text-sm text-slate-600">まだ参加者はいません。</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {joinedParticipants.map((participant) => (
              <div
                key={participant.userId}
                className="rounded-2xl border border-orange-100 bg-orange-50/40 px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {participant.name}
                    </span>
                    {participant.isHost ? (
                      <span className="rounded-full bg-orange-100 px-2 py-1 text-[11px] font-semibold text-orange-700">
                        ホスト
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">参加中</span>
                </div>
                <FavoriteMealsList meals={participant.favoriteMeals} className="mt-2" />
              </div>
            ))}
          </div>
        )}
      </Card>

      {isHost ? (
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
      ) : null}
    </div>
  );
}

type CandidateCardProps = {
  candidate: GroupMealCandidate;
  highlight?: boolean;
  checked: boolean;
  onToggle: () => void;
};

function CandidateCard({ candidate, highlight, checked, onToggle }: CandidateCardProps) {
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
          </div>
          <FavoriteMealsList meals={candidate.favoriteMeals} variant="pill" />
        </div>
      </label>
    </SurfaceCard>
  );
}

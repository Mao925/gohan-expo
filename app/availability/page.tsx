'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MatchedMembersSection } from '@/components/availability/matched-members-section';
import { PairScheduleDialog } from '@/components/availability/pair-schedule-dialog';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError, fetchAvailabilityStatus, AvailabilityStatusSummary } from '@/lib/api';
import {
  availabilityStatusToMark,
  createDefaultGrid,
  gridToSlots,
  slotsToGrid,
  TIMESLOTS,
  WEEKDAYS
} from '@/lib/availability';
import { useAuth } from '@/context/auth-context';
import { AvailabilityGrid, AvailabilitySlotDto, AvailabilityStatus, MemberRelationship, Profile, TimeSlot, Weekday } from '@/lib/types';
import { cn } from '@/lib/utils';

const makeToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const addDays = (date: Date, offset: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset);

const DAY_INDEX_TO_WEEKDAY: Weekday[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

type DisplayDay = {
  date: Date;
  weekday: Weekday;
  dayLabel: string;
  weekdayLabel: string;
};

type AvailabilitySlotButtonProps = {
  value: AvailabilityStatus;
  onToggle: () => void;
  disabled?: boolean;
};

function AvailabilitySlotButton({ value, onToggle, disabled }: AvailabilitySlotButtonProps) {
  const mark = availabilityStatusToMark(value);
  const symbol = mark === 'CIRCLE' ? '◯' : mark === 'TRIANGLE' ? '△' : '×';
  const isAvailable = value === 'AVAILABLE';
  const isMeetOnly = value === 'MEET_ONLY';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition',
        isAvailable
          ? 'border-brand bg-brand text-white shadow-sm'
          : isMeetOnly
            ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm'
            : 'border-orange-100 bg-white text-slate-400 hover:border-brand/40 hover:bg-brand/5',
        disabled && 'cursor-not-allowed opacity-70'
      )}
      aria-pressed={value !== 'UNAVAILABLE'}
    >
      {symbol}
    </button>
  );
}

export default function AvailabilityPage() {
  return (
    <CommunityGate>
      <AvailabilityContent />
    </CommunityGate>
  );
}

function AvailabilityContent() {
  const { token, user } = useAuth();
  const [grid, setGrid] = useState<AvailabilityGrid>(createDefaultGrid());
  const [today, setToday] = useState<Date>(makeToday);
  const [selectedMember, setSelectedMember] = useState<MemberRelationship | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatusSummary | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const { data: profileData } = useQuery<Profile>({
    queryKey: ['profile', token],
    queryFn: async () => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<Profile>('/api/profile', { token });
    },
    enabled: Boolean(token)
  });

  const { data, isPending } = useQuery<AvailabilitySlotDto[]>({
    queryKey: ['availability', token],
    queryFn: async () => {
      try {
        setError(null);
        setSuccessMessage(null);
        setIsForbidden(false);
        return await apiFetch<AvailabilitySlotDto[]>('/api/availability', { token });
      } catch (err: any) {
        const apiError = err as ApiError | undefined;
        if (apiError?.status === 403) {
          setIsForbidden(true);
          setError(apiError.message ?? 'この機能は一般ユーザーのみ利用できます');
        } else {
          setError(apiError?.message ?? '取得に失敗しました');
        }
        throw err;
      }
    },
    enabled: Boolean(token && !user?.isAdmin)
  });

  const loadAvailabilityStatus = useCallback(async () => {
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await fetchAvailabilityStatus(token);
      if (isMountedRef.current) {
        setAvailabilityStatus(data);
      }
    } catch (err) {
      console.error('Failed to load availability status', err);
      if (isMountedRef.current) {
        setAvailabilityStatus(null);
        setStatusError('空き日程の情報を取得できませんでした。');
      }
    } finally {
      if (isMountedRef.current) {
        setStatusLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    if (data) {
      setGrid(slotsToGrid(data));
      setSuccessMessage(null);
    }
  }, [data]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setAvailabilityStatus(null);
      setStatusLoading(false);
      setStatusError(null);
      return;
    }
    loadAvailabilityStatus();
  }, [token, loadAvailabilityStatus]);

  const mutation = useMutation<AvailabilitySlotDto[], ApiError, AvailabilitySlotDto[], { previousGrid: AvailabilityGrid }>({
    mutationFn: (payload) => apiFetch('/api/availability', { method: 'PUT', data: payload, token }),
    onMutate: async () => {
      setError(null);
      setSuccessMessage(null);
      return { previousGrid: grid };
    },
    onSuccess: (slots) => {
      setError(null);
      setIsForbidden(false);
      setGrid(slotsToGrid(slots));
      setSuccessMessage('保存しました');
      loadAvailabilityStatus();
    },
    onError: (err, _variables, context) => {
      if (context?.previousGrid) {
        setGrid(context.previousGrid);
      }
      if (err?.status === 403) {
        setIsForbidden(true);
        setError(err.message ?? 'この機能は一般ユーザーのみ利用できます');
      } else {
        setError(err?.message ?? '保存に失敗しました');
      }
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const next = makeToday();
      setToday((prev) => (prev.toDateString() === next.toDateString() ? prev : next));
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const displayDays = useMemo<DisplayDay[]>(() => {
    const days: DisplayDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(today, i);
      const weekday = DAY_INDEX_TO_WEEKDAY[date.getDay()];
      const weekdayLabel = WEEKDAYS.find((w) => w.value === weekday)?.label ?? '';
      days.push({
        date,
        weekday,
        dayLabel: String(date.getDate()),
        weekdayLabel
      });
    }
    return days;
  }, [today]);

  const cycleStatus = (status: AvailabilityStatus): AvailabilityStatus => {
    if (status === 'UNAVAILABLE') return 'AVAILABLE';
    if (status === 'AVAILABLE') return 'MEET_ONLY';
    return 'UNAVAILABLE';
  };

  const handleToggle = (weekday: Weekday, timeSlot: TimeSlot) => {
    const current = grid[weekday]?.[timeSlot] ?? 'UNAVAILABLE';
    const nextStatus = cycleStatus(current);

    const nextGrid: AvailabilityGrid = {
      ...grid,
      [weekday]: {
        ...grid[weekday],
        [timeSlot]: nextStatus
      }
    };

    setGrid(nextGrid);
    // Send the full 14-slot payload to align with backend expectations.
    mutation.mutate(gridToSlots(nextGrid));
  };

  const handleOpenDialog = (member: MemberRelationship) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  if (user?.isAdmin) {
    return (
      <Card>
        <p className="text-slate-700">この機能は一般ユーザーのみ利用できます。</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 md:space-y-12">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">日程調整</h1>
        <p className="mt-2 text-sm text-slate-500">曜日と昼 / 夜の組み合わせごとに空き状況を登録できます。</p>
      </div>
      <ErrorBanner message={isForbidden ? 'この機能は一般ユーザーのみ利用できます' : error} />
      {isPending && !data ? (
        <Card className="p-5 md:p-6">
          <p className="text-slate-500">読み込み中...</p>
        </Card>
      ) : isForbidden ? (
        <Card className="p-5 md:p-6">
          <p className="text-slate-700">この機能は一般ユーザーのみ利用できます。</p>
        </Card>
      ) : (
        <Card className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">今週の予定</h2>
              <p className="text-xs text-slate-500">今日から7日間の昼／夜の予定を登録できます。セルを切り替えると自動で保存されます。</p>
            </div>
            {mutation.isPending ? (
              <p className="text-sm font-semibold text-slate-600">保存中...</p>
            ) : successMessage ? (
              <p className="text-sm font-semibold text-emerald-600">{successMessage}</p>
            ) : null}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="text-lg">◯</span>
              リアル・Meet の両方 OK
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">△</span>
              Meet のみ OK
            </span>
            <span className="flex items-center gap-1">
              <span className="text-lg">×</span>
              どちらも NG
            </span>
          </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px] space-y-4">
              <div className="grid grid-cols-[64px_1fr] gap-3 text-center text-sm text-slate-600">
                <div />
                <div className="grid grid-cols-7 gap-3">
                  {displayDays.map((d) => (
                    <div key={d.date.toISOString()} className="space-y-1">
                      <div className="text-base font-semibold text-slate-900">{d.dayLabel}</div>
                      <div className="text-xs text-slate-500">{d.weekdayLabel}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {TIMESLOTS.map((slot) => (
                  <div key={slot.value} className="grid grid-cols-[64px_1fr] items-center gap-3">
                    <div className="text-right text-sm font-semibold text-slate-600">{slot.label}</div>
                    <div className="grid grid-cols-7 gap-3">
                      {displayDays.map((d) => (
                        <div key={`${d.weekday}-${slot.value}`} className="flex items-center justify-center">
                          <AvailabilitySlotButton
                            value={grid[d.weekday]?.[slot.value] ?? 'UNAVAILABLE'}
                            onToggle={() => handleToggle(d.weekday, slot.value)}
                            disabled={mutation.isPending}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <section className="mt-10 space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">マッチしたメンバー</h2>
          <p className="text-xs text-slate-500">GO / STAY の予定を確認できます。</p>
        </div>

        {statusError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {statusError}
          </div>
        )}

        {!statusLoading && availabilityStatus && !availabilityStatus.meetsRequirement && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold mb-1">まだマッチ相手を確認できません</p>
            <p className="mb-1">
              現在、空いている日程は
              <span className="mx-1 font-semibold">{availabilityStatus.availableCount}件</span>
              です。
            </p>
            <p>
              マッチ相手を確認するには、空き日程を少なくとも
              <span className="mx-1 font-semibold">{availabilityStatus.required}件</span>
              登録してください。
            </p>
          </div>
        )}

        {statusLoading ? (
          <Card className="bg-white/70 p-4 text-sm text-slate-500">
            マッチしたメンバーの状況を確認しています...
          </Card>
        ) : availabilityStatus && availabilityStatus.meetsRequirement ? (
          <MatchedMembersSection
            onSelectMember={handleOpenDialog}
            highlightMeals={profileData?.favoriteMeals}
            showHeader={false}
          />
        ) : (
          !statusLoading &&
          availabilityStatus &&
          !availabilityStatus.meetsRequirement && (
            <div className="text-xs text-slate-500">
              まずは上の空き日程から、GO飯できる枠を増やしてみてください。
            </div>
          )
        )}
      </section>

      <PairScheduleDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setSelectedMember(null);
        }}
        partner={selectedMember}
      />
    </div>
  );
}

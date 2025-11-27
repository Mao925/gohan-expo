'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { createDefaultGrid, gridToSlots, slotsToGrid, TIMESLOTS, WEEKDAYS } from '@/lib/availability';
import { useAuth } from '@/context/auth-context';
import { AvailabilityGrid, AvailabilitySlotDto, AvailabilityStatus, TimeSlot, Weekday } from '@/lib/types';
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
  const isAvailable = value === 'AVAILABLE';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition',
        isAvailable
          ? 'border-brand bg-brand text-white shadow-sm'
          : 'border-orange-100 bg-white text-slate-400 hover:border-brand/40 hover:bg-brand/5',
        disabled && 'cursor-not-allowed opacity-70'
      )}
      aria-pressed={isAvailable}
    >
      {isAvailable ? '◯' : '×'}
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isForbidden, setIsForbidden] = useState(false);

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

  useEffect(() => {
    if (data) {
      setGrid(slotsToGrid(data));
      setSuccessMessage(null);
    }
  }, [data]);

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

  const handleToggle = (weekday: Weekday, timeSlot: TimeSlot) => {
    const current = grid[weekday]?.[timeSlot] ?? 'UNAVAILABLE';
    const nextStatus: AvailabilityStatus = current === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';

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

  if (user?.isAdmin) {
    return (
      <Card>
        <p className="text-slate-700">この機能は一般ユーザーのみ利用できます。</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
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
    </div>
  );
}

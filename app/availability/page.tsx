'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Card } from '@/components/ui/card';
import { apiFetch, ApiError } from '@/lib/api';
import { createDefaultGrid, gridToSlots, slotsToGrid, TIMESLOTS, WEEKDAYS } from '@/lib/availability';
import { useAuth } from '@/context/auth-context';
import { AvailabilityGrid, AvailabilitySlotDto, AvailabilityStatus, TimeSlot, Weekday } from '@/lib/types';
import { cn } from '@/lib/utils';

type AvailabilityToggleProps = {
  value: AvailabilityStatus;
  onChange: (next: AvailabilityStatus) => void;
  disabled?: boolean;
};

function AvailabilityToggle({ value, onChange, disabled }: AvailabilityToggleProps) {
  const isAvailable = value === 'AVAILABLE';

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange('AVAILABLE')}
        disabled={disabled}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition',
          isAvailable
            ? 'border-brand bg-brand text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-500 hover:border-brand/40 hover:bg-brand/5',
          disabled && 'cursor-not-allowed opacity-70'
        )}
        aria-pressed={isAvailable}
      >
        ○
      </button>
      <button
        type="button"
        onClick={() => onChange('UNAVAILABLE')}
        disabled={disabled}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition',
          !isAvailable
            ? 'border-brand bg-brand text-white shadow-sm'
            : 'border-slate-200 bg-white text-slate-500 hover:border-brand/40 hover:bg-brand/5',
          disabled && 'cursor-not-allowed opacity-70'
        )}
        aria-pressed={!isAvailable}
      >
        ×
      </button>
    </div>
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

  const handleToggle = (weekday: Weekday, timeSlot: TimeSlot, status: AvailabilityStatus) => {
    if (grid[weekday]?.[timeSlot] === status) return;

    const nextGrid: AvailabilityGrid = {
      ...grid,
      [weekday]: {
        ...grid[weekday],
        [timeSlot]: status
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">セルを切り替えると自動で保存されます。</p>
            {mutation.isPending ? (
              <p className="text-sm font-semibold text-slate-600">保存中...</p>
            ) : successMessage ? (
              <p className="text-sm font-semibold text-emerald-600">{successMessage}</p>
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm text-slate-700 md:text-base">
              <thead>
                <tr>
                  <th className="w-32 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm">曜日</th>
                  {TIMESLOTS.map((slot) => (
                    <th key={slot.value} className="py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm">
                      {slot.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKDAYS.map((weekday) => (
                  <tr key={weekday.value} className="border-t border-orange-100">
                    <th className="py-3 text-left text-base font-semibold text-slate-900">{weekday.label}</th>
                    {TIMESLOTS.map((slot) => (
                      <td key={slot.value} className="py-2 text-center">
                        <AvailabilityToggle
                          value={grid[weekday.value]?.[slot.value] ?? 'UNAVAILABLE'}
                          onChange={(next) => handleToggle(weekday.value, slot.value, next)}
                          disabled={mutation.isPending}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

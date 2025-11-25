'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch, ApiError } from '@/lib/api';
import { AvailabilityGrid, AvailabilitySlotDto, AvailabilityStatus, TimeSlot, Weekday } from '@/lib/types';
import { createDefaultGrid, gridToPayload, gridToSlots, slotsToGrid, TIMESLOTS, WEEKDAYS } from '@/lib/availability';
import { useAuth } from '@/context/auth-context';

const statusOptions: { value: AvailabilityStatus; label: string }[] = [
  { value: 'AVAILABLE', label: '◯' },
  { value: 'UNAVAILABLE', label: '×' }
];

export default function AvailabilityPage() {
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
    }
  }, [data]);

  const mutation = useMutation<AvailabilitySlotDto[], ApiError, AvailabilitySlotDto[]>({
    mutationFn: (payload) => apiFetch('/api/availability', { method: 'PUT', data: payload, token }),
    onSuccess: (slots) => {
      setError(null);
      setIsForbidden(false);
      setGrid(slotsToGrid(slots));
      setSuccessMessage('保存しました');
    },
    onError: (err) => {
      if (err?.status === 403) {
        setIsForbidden(true);
        setError(err.message ?? 'この機能は一般ユーザーのみ利用できます');
      } else {
        setError(err?.message ?? '保存に失敗しました');
      }
    }
  });

  const handleChange = (weekday: Weekday, timeSlot: TimeSlot, status: AvailabilityStatus) => {
    setGrid((prev) => ({
      ...prev,
      [weekday]: {
        ...prev[weekday],
        [timeSlot]: status
      }
    }));
  };

  // Flatten the 2D grid into the DTO array expected by the API.
  const handleSubmit = () => {
    setSuccessMessage(null);
    setError(null);
    mutation.mutate(gridToPayload(grid));
  };

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">ログインすると日程調整を登録できます。</p>
      </Card>
    );
  }

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
                        <select
                          className="w-24 rounded-xl border border-orange-100 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/30 md:w-28"
                          value={grid[weekday.value]?.[slot.value] ?? 'UNAVAILABLE'}
                          onChange={(event) =>
                            handleChange(weekday.value, slot.value, event.target.value as AvailabilityStatus)
                          }
                          disabled={mutation.isPending}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSubmit} disabled={mutation.isPending}>
              {mutation.isPending ? '保存中...' : '保存する'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setGrid(createDefaultGrid())} disabled={mutation.isPending}>
              すべて × に戻す
            </Button>
            {successMessage ? <p className="text-sm font-semibold text-emerald-600">{successMessage}</p> : null}
          </div>
        </Card>
      )}
    </div>
  );
}

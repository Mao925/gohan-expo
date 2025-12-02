'use client';

import { useMemo } from 'react';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { SurfaceCard } from '@/components/ui/surface-card';
import { PairAvailabilitySlotDto } from '@/lib/api/availability';
import { buildPairCellsForNext7Days, getNext7Days, PairCell, TIMESLOTS } from '@/lib/availability';
import { TimeSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

type PairScheduleContentProps = {
  pairAvailabilitySlots: PairAvailabilitySlotDto[];
  userName?: string | null;
  userFavoriteMeals?: string[];
  partnerName?: string | null;
  partnerFavoriteMeals?: string[];
};

export function PairScheduleContent({
  pairAvailabilitySlots,
  userName,
  userFavoriteMeals,
  partnerName,
  partnerFavoriteMeals
}: PairScheduleContentProps) {
  const days = useMemo(() => getNext7Days(), []);

  const cells = useMemo<PairCell[]>(() => {
    return buildPairCellsForNext7Days(days, pairAvailabilitySlots ?? []);
  }, [days, pairAvailabilitySlots]);

  const cellMap = useMemo(() => {
    const map = new Map<string, PairCell>();
    cells.forEach((cell) => map.set(`${cell.dayIndex}-${cell.timeSlot}`, cell));
    return map;
  }, [cells]);

  const getCellLabel = (selfAvailable: boolean, partnerAvailable: boolean) => {
    if (selfAvailable && partnerAvailable) return 'あなたも相手も参加できる枠です';
    if (!selfAvailable && partnerAvailable) return '相手だけ参加できる枠です（あなたは×）';
    return 'どちらも参加できない枠です';
  };

  const renderCell = (dayIndex: number, timeSlot: TimeSlot) => {
    const cell = cellMap.get(`${dayIndex}-${timeSlot}`);
    const selfAvailable = cell?.selfAvailable ?? false;
    const partnerAvailable = cell?.partnerAvailable ?? false;

    const baseClasses = 'flex h-12 items-center justify-center rounded-xl text-sm font-semibold';

    if (selfAvailable && partnerAvailable) {
      return (
        <div
          key={`${dayIndex}-${timeSlot}`}
          className={cn(baseClasses, 'bg-emerald-500 text-white shadow-sm')}
          title={getCellLabel(selfAvailable, partnerAvailable)}
          aria-label={getCellLabel(selfAvailable, partnerAvailable)}
        >
          GO
        </div>
      );
    }

    if (!selfAvailable && partnerAvailable) {
      return (
        <div
          key={`${dayIndex}-${timeSlot}`}
          className={cn(baseClasses, 'border border-emerald-400 bg-white text-emerald-500')}
          title={getCellLabel(selfAvailable, partnerAvailable)}
          aria-label={getCellLabel(selfAvailable, partnerAvailable)}
        >
          GO
        </div>
      );
    }

    return (
      <div
        key={`${dayIndex}-${timeSlot}`}
        className={cn(baseClasses, 'bg-slate-50 text-slate-300')}
        title={getCellLabel(selfAvailable, partnerAvailable)}
        aria-label={getCellLabel(selfAvailable, partnerAvailable)}
      >
        ×
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <SurfaceCard className="overflow-x-auto p-4 md:p-5">
        <div className="min-w-[620px] space-y-4">
          <div className="grid grid-cols-[72px_1fr] gap-3 text-center text-sm text-[var(--text-muted)]">
            <div />
            <div className="grid grid-cols-7 gap-3">
              {days.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className="space-y-1 rounded-xl bg-slate-50 py-2"
                >
                  <div className="text-base font-semibold text-[var(--text-strong)]">{day.dayLabel}</div>
                  <div className="text-xs text-[var(--text-muted)]">{day.weekdayLabel}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {TIMESLOTS.map((slot) => (
              <div key={slot.value} className="grid grid-cols-[72px_1fr] items-center gap-3">
                <div className="text-right text-sm font-semibold text-[var(--text-strong)]">{slot.label}</div>
                <div className="grid grid-cols-7 gap-3">
                  {days.map((_, dayIndex) => renderCell(dayIndex, slot.value))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-2 p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-lg bg-emerald-500 px-2 py-1 text-[11px] font-semibold text-white">
            GO
          </span>
          <span className="text-[var(--text-strong)]">あなた・相手の両方が参加できる枠</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-lg border border-emerald-400 px-2 py-1 text-[11px] font-semibold text-emerald-600">
            GO
          </span>
          <span className="text-[var(--text-strong)]">相手のみ参加できる枠（自分は×）</span>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4 p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{userName ?? 'あなた'}</p>
            <FavoriteMealsList
              meals={userFavoriteMeals}
              placeholder="好きなご飯: 未設定"
              highlightMeals={partnerFavoriteMeals}
              variant="pill"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[var(--text-strong)]">{partnerName ?? 'お相手'}</p>
            <FavoriteMealsList
              meals={partnerFavoriteMeals}
              placeholder="好きなご飯: 未設定"
              highlightMeals={userFavoriteMeals}
              variant="pill"
            />
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}

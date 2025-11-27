'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ErrorBanner } from '@/components/error-banner';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { fetchPairAvailability, PairAvailabilitySlotDto } from '@/lib/api/availability';
import { buildPairCellsForNext7Days, getNext7Days, Next7Day, PairCell, TIMESLOTS } from '@/lib/availability';
import { MemberRelationship, Profile, TimeSlot } from '@/lib/types';
import { cn } from '@/lib/utils';

type PairScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: MemberRelationship | null;
};

export function PairScheduleDialog({ open, onOpenChange, partner }: PairScheduleDialogProps) {
  const { token, user } = useAuth();
  const partnerUserId = partner?.targetUserId ?? partner?.id ?? null;

  const { data: profileData } = useQuery<Profile>({
    queryKey: ['profile', token],
    queryFn: () => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<Profile>('/api/profile', { token });
    },
    enabled: open && Boolean(token)
  });

  const {
    data: pairData,
    isPending,
    error
  } = useQuery<{ slots: PairAvailabilitySlotDto[] }>({
    queryKey: ['pair-availability', partnerUserId, token],
    queryFn: async () => {
      if (!partnerUserId) throw new Error('表示するお相手が見つかりません');
      return fetchPairAvailability(partnerUserId, token ?? undefined);
    },
    enabled: open && Boolean(partnerUserId && token)
  });

  const days = useMemo<Next7Day[]>(() => getNext7Days(), [open]);

  const cells = useMemo<PairCell[]>(() => buildPairCellsForNext7Days(days, pairData?.slots ?? []), [days, pairData?.slots]);

  const cellMap = useMemo(() => {
    const map = new Map<string, PairCell>();
    cells.forEach((cell) => map.set(`${cell.dayIndex}-${cell.timeSlot}`, cell));
    return map;
  }, [cells]);

  const renderCell = (dayIndex: number, timeSlot: TimeSlot) => {
    const cell = cellMap.get(`${dayIndex}-${timeSlot}`);
    const selfAvailable = cell?.selfAvailable ?? false;
    const partnerAvailable = cell?.partnerAvailable ?? false;

    const baseClasses = 'flex h-12 items-center justify-center rounded-xl text-sm font-semibold';

    if (selfAvailable && partnerAvailable) {
      return (
        <div key={`${dayIndex}-${timeSlot}`} className={cn(baseClasses, 'bg-emerald-500 text-white shadow-sm')}>
          GO
        </div>
      );
    }

    if (!selfAvailable && partnerAvailable) {
      return (
        <div key={`${dayIndex}-${timeSlot}`} className={cn(baseClasses, 'border border-emerald-400 bg-white text-emerald-500')}>
          GO
        </div>
      );
    }

    return (
      <div key={`${dayIndex}-${timeSlot}`} className={cn(baseClasses, 'bg-slate-50 text-slate-300')}>
        ×
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <DialogTitle className="text-xl font-semibold text-slate-900">{partner ? `${partner.name}さんとの日程` : '日程'}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">今週の GO / STAY を確認できます。</DialogDescription>
        </div>

        {isPending ? (
          <p className="py-10 text-center text-slate-500">読み込み中...</p>
        ) : error ? (
          <ErrorBanner message={(error as Error)?.message ?? '取得に失敗しました'} />
        ) : !pairData ? (
          <p className="py-10 text-center text-slate-500">データがありません。</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="min-w-[620px] space-y-4">
                <div className="grid grid-cols-[72px_1fr] gap-3 text-center text-sm text-slate-600">
                  <div />
                  <div className="grid grid-cols-7 gap-3">
                    {days.map((d) => (
                      <div key={d.date.toISOString()} className="space-y-1 rounded-xl bg-slate-50 py-2">
                        <div className="text-base font-semibold text-slate-900">{d.dayLabel}</div>
                        <div className="text-xs text-slate-500">{d.weekdayLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {TIMESLOTS.map((slot) => (
                    <div key={slot.value} className="grid grid-cols-[72px_1fr] items-center gap-3">
                      <div className="text-right text-sm font-semibold text-slate-700">{slot.label}</div>
                      <div className="grid grid-cols-7 gap-3">
                        {days.map((_, dayIndex) => renderCell(dayIndex, slot.value))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Card className="space-y-4 border border-slate-100 bg-slate-50 p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{user?.name ?? 'あなた'}</p>
                  <FavoriteMealsList
                    meals={profileData?.favoriteMeals}
                    placeholder="好きなご飯: 未設定"
                    highlightMeals={partner?.favoriteMeals}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">{partner?.name ?? 'お相手'}</p>
                  <FavoriteMealsList
                    meals={partner?.favoriteMeals}
                    placeholder="好きなご飯: 未設定"
                    highlightMeals={profileData?.favoriteMeals}
                  />
                </div>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
                閉じる
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

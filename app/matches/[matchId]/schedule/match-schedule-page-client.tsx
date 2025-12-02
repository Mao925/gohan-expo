'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/error-banner';
import { PairScheduleContent } from '@/components/availability/pair-schedule-content';
import { ApiError, apiFetch } from '@/lib/api';
import { fetchPairAvailability, PairAvailabilitySlotDto } from '@/lib/api/availability';
import { Profile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

type MatchDetailResponse = {
  id: string;
  partnerUserId?: string;
  partnerId?: string;
  partnerName?: string | null;
  partnerFavoriteMeals?: string[];
  partnerProfileImageUrl?: string | null;
  partner?: {
    userId?: string;
    id?: string;
    name?: string | null;
    favoriteMeals?: string[];
    profileImageUrl?: string | null;
  };
  targetUserId?: string;
};

type MatchSchedulePageClientProps = {
  matchId: string;
};

const getMatchErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 403) return 'このマッチのスケジュールにはアクセスできません';
    if (error.status === 404) return '指定されたマッチが見つかりませんでした';
    return error.message ?? '取得に失敗しました';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '取得に失敗しました';
};

const getPairErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    return error.message ?? '空き枠の取得に失敗しました';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '空き枠の取得に失敗しました';
};

export function MatchSchedulePageClient({ matchId }: MatchSchedulePageClientProps) {
  const { token, user } = useAuth();

  const { data: profileData } = useQuery<Profile>({
    queryKey: ['profile', token],
    queryFn: async () => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<Profile>('/api/profile', { token });
    },
    enabled: Boolean(token)
  });

  const {
    data: matchData,
    isPending: matchLoading,
    error: matchError,
    refetch: refetchMatch
  } = useQuery<MatchDetailResponse>({
    queryKey: ['match-detail', matchId, token],
    queryFn: async () => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<MatchDetailResponse>(`/api/matches/${matchId}`, { token });
    },
    enabled: Boolean(token)
  });

  const partnerUserId = useMemo(() => {
    if (!matchData) return undefined;
    return (
      matchData.partnerUserId ??
      matchData.partner?.userId ??
      matchData.partner?.id ??
      matchData.partnerId ??
      matchData.targetUserId
    );
  }, [matchData]);

  const {
    data: pairAvailability,
    isPending: pairLoading,
    error: pairError,
    refetch: refetchPair
  } = useQuery<{ slots: PairAvailabilitySlotDto[] }>({
    queryKey: ['pair-availability', partnerUserId, token],
    queryFn: async () => {
      if (!partnerUserId) throw new Error('表示するお相手が見つかりません');
      return fetchPairAvailability(partnerUserId, token ?? undefined);
    },
    enabled: Boolean(partnerUserId && token)
  });

  const matchErrorMessage = matchError ? getMatchErrorMessage(matchError) : null;
  const pairErrorMessage = pairError ? getPairErrorMessage(pairError) : null;
  const partnerName =
    matchData?.partner?.name ?? matchData?.partnerName ?? matchData?.partner?.userId ?? null;
  const partnerFavoriteMeals =
    matchData?.partner?.favoriteMeals ?? matchData?.partnerFavoriteMeals ?? [];
  const userFavoriteMeals = profileData?.favoriteMeals ?? [];
  const userName = user?.name ?? profileData?.name ?? 'あなた';
  const missingPartnerId = Boolean(matchData && !partnerUserId);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900">日程を合わせる</h1>
          <p className="text-sm text-slate-500">今週の GO / STAY を確認できます。</p>
        </div>
        <Card className="p-6 text-sm text-slate-500">読み込み中です...</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900">日程を合わせる</h1>
        <p className="text-sm text-slate-500">今週の GO / STAY を確認できます。</p>
      </div>

      {matchLoading && !matchData ? (
        <Card className="p-6 text-sm text-slate-500">読み込み中です...</Card>
      ) : matchError ? (
        <>
          <ErrorBanner message={matchErrorMessage} />
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => refetchMatch()}>
              再読み込み
            </Button>
            <Link
              href="/matches"
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
            >
              マッチ一覧へ戻る
            </Link>
          </div>
        </>
      ) : !matchData ? (
        <Card className="p-6 text-center text-sm text-slate-500">データがありません。</Card>
      ) : (
        <>
          {missingPartnerId ? (
            <>
              <ErrorBanner message="このマッチのお相手を確認できませんでした。" />
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/matches"
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
                >
                  マッチ一覧へ戻る
                </Link>
              </div>
            </>
          ) : pairLoading && !pairAvailability ? (
            <Card className="p-6 text-sm text-slate-500">空き枠を取得しています...</Card>
          ) : pairError ? (
            <>
              <ErrorBanner message={pairErrorMessage} />
              <Button variant="secondary" size="sm" onClick={() => refetchPair()}>
                再読み込み
              </Button>
            </>
          ) : (
            <PairScheduleContent
              pairAvailabilitySlots={pairAvailability?.slots ?? []}
              userName={userName}
              userFavoriteMeals={userFavoriteMeals}
              partnerName={partnerName}
              partnerFavoriteMeals={partnerFavoriteMeals}
            />
          )}
        </>
      )}
    </div>
  );
}

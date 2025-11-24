'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { Match } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { MatchCard } from '@/components/match-card';
import { useCommunityStatus } from '@/hooks/use-community-status';
import { Button } from '@/components/ui/button';
import { FavoriteMealsList } from '@/components/favorite-meals-list';

type StoredJoin = {
  communityCode: string;
  communityName?: string;
};
const STORAGE_KEY = 'gohan_last_community_join';

export default function MatchesPage() {
  const { token } = useAuth();
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useCommunityStatus({ refetchInterval: 15000 });
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [lastJoin, setLastJoin] = useState<StoredJoin | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setLastJoin(JSON.parse(raw) as StoredJoin);
    } catch {
      setLastJoin(null);
    }
  }, []);

  const { data, isPending } = useQuery<Match[]>({
    queryKey: ['matches', token],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch<Match[]>('/api/matches', { token });
      } catch (err: any) {
        setError(err?.message ?? '取得に失敗しました');
        throw err;
      }
    },
    enabled: Boolean(token && statusData?.status === 'APPROVED')
  });

  const reapplyMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error('ログインしてください');
      if (!lastJoin?.communityCode) throw new Error('コミュニティコードが保存されていません');
      return apiFetch('/api/community/join', {
        method: 'POST',
        data: { communityCode: lastJoin.communityCode },
        token
      });
    },
    onSuccess: async () => {
      setPendingMessage('前回のコードで再申請しました。');
      await refetchStatus();
    },
    onError: (err: any) => setPendingMessage(err?.message ?? '再申請に失敗しました')
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">ログインするとマッチ履歴が確認できます。</p>
      </Card>
    );
  }

  if (statusLoading) {
    return (
      <Card>
        <p className="text-slate-700">ステータスを確認しています...</p>
      </Card>
    );
  }

  if (statusData?.status !== 'APPROVED') {
    return (
      <Card className="space-y-4 border border-orange-100 bg-orange-50 p-6">
        <p className="text-slate-700">コミュニティの承認待ちです。承認されるとマッチ一覧が表示されます。</p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/community/join">コミュニティ申請画面へ</Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="rounded-full bg-slate-900 px-6 py-3 text-white hover:bg-slate-800"
            disabled={!lastJoin?.communityCode || reapplyMutation.isPending}
            onClick={() => reapplyMutation.mutate()}
          >
            {reapplyMutation.isPending ? '再申請中...' : lastJoin?.communityCode ? '前回のコードで再申請' : 'コード未保存'}
          </Button>
        </div>
        {!lastJoin?.communityCode ? <p className="text-xs text-slate-500">一度申請コードを入力すると再申請ボタンが有効になります。</p> : null}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">マッチ済み</h1>
        <p className="mt-2 text-sm text-slate-500">両想いになった相手が表示されます。</p>
      </div>
      <ErrorBanner message={pendingMessage ?? error} />
      {isPending ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((match) => (
            <Dialog key={match.id}>
              <DialogTrigger asChild>
                <button className="w-full text-left">
                  <MatchCard match={match} />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{match.partnerName}</DialogTitle>
                </DialogHeader>
                <p className="text-sm font-semibold text-slate-700">好きなご飯</p>
                <FavoriteMealsList meals={match.partnerFavoriteMeals} />
                <p className="mt-4 text-sm text-slate-500">マッチしました。連絡先はご自身で交換してください。</p>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-slate-500">まだマッチはありません。</p>
        </Card>
      )}
    </div>
  );
}

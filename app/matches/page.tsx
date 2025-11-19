'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { Match } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { MatchCard } from '@/components/match-card';

export default function MatchesPage() {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);

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
    enabled: Boolean(token)
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">ログインするとマッチ履歴が確認できます。</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">マッチ済み</h1>
        <p className="mt-2 text-sm text-slate-500">両想いになった相手が表示されます。</p>
      </div>
      <ErrorBanner message={error} />
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
                <p className="text-sm text-slate-600">{match.partnerBio}</p>
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

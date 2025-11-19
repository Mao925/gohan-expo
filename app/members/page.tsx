'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { MemberCard } from '@/components/member-card';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { Member } from '@/lib/types';
import { useAuth } from '@/context/auth-context';

export default function MembersPage() {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data, isPending, refetch } = useQuery<Member[]>({
    queryKey: ['members', token],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch<Member[]>('/api/members', { token });
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
        <p className="text-slate-700">会員限定のページです。まずはログインしてください。</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">承認済みメンバー</h1>
          <button className="text-sm text-slate-500 underline-offset-4 hover:underline" onClick={() => refetch()}>
            更新
          </button>
        </div>
        <p className="text-sm text-slate-500">同じコミュニティで承認済みのメンバーだけが表示されます。</p>
      </div>
      <ErrorBanner message={error} />
      {isPending ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-slate-500">まだ表示できるメンバーがいません。</p>
        </Card>
      )}
    </div>
  );
}

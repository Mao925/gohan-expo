'use client';

import Link from 'next/link';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MemberCard } from '@/components/member-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { Member } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useCommunityStatus } from '@/hooks/use-community-status';

type StoredJoin = {
  communityCode: string;
  communityName?: string;
};

const STORAGE_KEY = 'gohan_last_community_join';

export default function MembersPage() {
  const { token, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [lastJoin, setLastJoin] = useState<StoredJoin | null>(null);
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useCommunityStatus({ refetchInterval: 15000 });
  const isAdminUser = Boolean(user?.isAdmin);

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
    enabled: Boolean(token && statusData?.status === 'APPROVED')
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch('/api/admin/remove-member', {
        method: 'POST',
        data: { userId: memberId },
        token
      });
    },
    onSuccess: async () => {
      setPendingMessage('メンバーを削除しました。相手には再申請を依頼してください。');
      await Promise.all([refetch(), refetchStatus()]);
    },
    onError: (err: any) => setPendingMessage(err?.message ?? 'メンバーの削除に失敗しました')
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
      setPendingMessage('前回のコードで再申請しました。承認をお待ちください。');
      await refetchStatus();
    },
    onError: (err: any) => setPendingMessage(err?.message ?? '再申請に失敗しました')
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">会員限定のページです。まずはログインしてください。</p>
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
        <p className="text-slate-700">まだコミュニティへの参加申請が完了していません。まずはコードを入力して申請を行ってください。</p>
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
        {!lastJoin?.communityCode ? <p className="text-xs text-slate-500">一度コミュニティ申請画面でコードを入力すると再申請ボタンが有効になります。</p> : null}
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
      <ErrorBanner message={pendingMessage ?? error} />
      {isPending ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((member) => {
            const removableProps =
              isAdminUser && !member.isSelf
                ? {
                    canRemove: true,
                    onRemove: (id: string) => removeMemberMutation.mutate(id)
                  }
                : undefined;
            return <MemberCard key={member.id} member={member} {...(removableProps ?? {})} />;
          })}
        </div>
      ) : (
        <Card>
          <p className="text-slate-500">まだ表示できるメンバーがいません。</p>
        </Card>
      )}
    </div>
  );
}

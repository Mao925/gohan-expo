'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunityNoticeCard } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { Field } from '@/components/forms/field';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { ApiError, apiFetch } from '@/lib/api';
import { CommunityStatus } from '@/lib/types';
import { CommunityPhase, useCommunitySelfStatus } from '@/hooks/use-community-self-status';

const schema = z.object({
  communityName: z.string().min(2, 'コミュニティ名を入力してください'),
  communityCode: z.string().length(8, '8桁のコードを入力してください')
});

const STORAGE_KEY = 'gohan_last_community_join';

type FormValues = z.infer<typeof schema>;

type JoinResponse = {
  status: CommunityStatus;
  communityName?: string;
};

const pillByPhase: Record<CommunityPhase, 'UNAPPLIED' | 'PENDING' | 'APPROVED'> = {
  NO_COMMUNITY: 'UNAPPLIED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED'
};

export default function CommunityJoinPage() {
  const { token, refreshUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { communityName: '', communityCode: '' }
  });

  const {
    data: statusData,
    isLoading: statusLoading,
    isFetching: statusFetching,
    error: statusError,
    refetch: refetchStatus
  } = useCommunitySelfStatus(Boolean(token));

  useEffect(() => {
    // 一般ユーザーは承認後にメイン画面へ誘導する
    if (statusData?.phase === 'APPROVED' && !statusData.isAdmin) {
      router.replace('/members');
    }
  }, [statusData, router]);

  const joinMutation = useMutation<JoinResponse, ApiError, FormValues>({
    mutationFn: (values) => apiFetch<JoinResponse>('/api/community/join', { method: 'POST', data: values, token }),
    onSuccess: async (data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['community-self-status', token] });
      await refetchStatus();
      if (data.status === 'APPROVED') {
        await refreshUser();
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
      }
      form.reset();
    }
  });

  // 未ログイン時はフォームを出さずログイン導線のみを表示する
  if (!token) {
    return (
      <CommunityNoticeCard
        title="コミュニティに参加するにはログインが必要です"
        description="先にアカウントを作成するか、ログインしてください。"
        action={{ label: 'ログインへ', href: '/login' }}
      />
    );
  }

  if (statusLoading) {
    return (
      <CommunityNoticeCard
        title="ステータスを確認しています"
        description="コミュニティ参加状況を確認しています。"
        loading
      />
    );
  }

  const phase: CommunityPhase = statusData?.phase ?? 'NO_COMMUNITY';
  const isAdmin = statusData?.isAdmin ?? false;
  const communityName = statusData?.community?.name;
  const badgeStatus = pillByPhase[phase];
  const combinedError = error ?? (statusError as ApiError | undefined)?.message ?? null;

  if (phase === 'PENDING') {
    return (
      <CommunityNoticeCard
        title={`${communityName ?? 'コミュニティ'} に申請中です`}
        description="管理者が承認すると、この画面から各機能を利用できるようになります。しばらくお待ちください。"
        action={{
          label: statusFetching ? '確認中...' : '最新の状態を確認',
          onClick: () => refetchStatus(),
          disabled: statusFetching
        }}
      />
    );
  }

  if (phase === 'APPROVED' && !isAdmin) {
    return (
      <CommunityNoticeCard
        title="コミュニティが承認されました"
        description="メンバー一覧へ移動します。"
        action={{ label: 'メンバーを確認する', href: '/members' }}
      />
    );
  }

  const showForm = phase === 'NO_COMMUNITY';

  return (
    <div className="mx-auto max-w-4xl md:max-w-5xl space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">コミュニティ参加</h1>
        <p className="mt-2 text-sm text-slate-500">管理者から共有されたコードで参加申請してください。</p>
      </div>
      <Card className="space-y-6 p-5 md:grid md:grid-cols-[1.1fr,1.4fr] md:items-start md:gap-6 md:space-y-0 md:p-6">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">現在のステータス</p>
          {communityName ? (
            <p className="text-xl font-semibold text-slate-900">{communityName}</p>
          ) : (
            <p className="text-base text-slate-400">承認済みになるとコミュニティ名が表示されます</p>
          )}
          <StatusPill status={badgeStatus} />
          {isAdmin ? (
            <p className="text-xs text-slate-500">管理者なので、承認前でもコミュニティ管理を開けます。</p>
          ) : null}
        </div>
        <div className="space-y-5">
          <ErrorBanner message={combinedError} />
          {showForm || isAdmin ? (
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(async (values) => {
                setError(null);
                try {
                  await joinMutation.mutateAsync(values);
                } catch (err: any) {
                  setError(err?.message ?? '申請に失敗しました');
                }
              })}
            >
              <Field label="コミュニティ名" error={form.formState.errors.communityName?.message}>
                <Input placeholder="KING" {...form.register('communityName')} />
              </Field>
              <Field label="8桁のコミュニティコード" error={form.formState.errors.communityCode?.message}>
                <Input placeholder="ABCD1234" maxLength={8} {...form.register('communityCode')} />
              </Field>
              <Button type="submit" disabled={joinMutation.isPending || statusFetching} className="w-full">
                {joinMutation.isPending ? '送信中...' : showForm ? '参加申請する' : 'コードを更新する'}
              </Button>
            </form>
          ) : (
            <div className="space-y-4 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm text-slate-700">
                コミュニティが承認されています。管理者として申請状況を確認する場合は、承認画面へ移動してください。
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link href="/admin">承認画面を開く</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/members">メンバー一覧へ</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

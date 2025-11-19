'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/forms/field';
import { ErrorBanner } from '@/components/error-banner';
import { StatusPill } from '@/components/status-pill';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { CommunityStatus } from '@/lib/types';
import { useCommunityStatus } from '@/hooks/use-community-status';
import { DEV_APPROVE_ENDPOINT, triggerDevApprove } from '@/lib/dev-tools';

const schema = z.object({
  communityCode: z.string().length(8, '8桁のコードを入力してください')
});

const STORAGE_KEY = 'gohan_last_community_code';

type FormValues = z.infer<typeof schema>;

type JoinResponse = {
  status: CommunityStatus;
};

export default function CommunityJoinPage() {
  const { token, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [devLoading, setDevLoading] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { communityCode: '' }
  });
  const showDevShortcut = process.env.NODE_ENV !== 'production' && Boolean(DEV_APPROVE_ENDPOINT && token);

  const {
    data: statusData,
    refetch,
    isFetching,
    error: statusError
  } = useCommunityStatus({ refetchInterval: 15000 });

  const joinMutation = useMutation<JoinResponse, any, FormValues>({
    mutationFn: (values) => apiFetch<JoinResponse>('/api/community/join', { method: 'POST', data: values, token }),
    onSuccess: async (data, variables) => {
      await refetch();
      if (data.status === 'APPROVED') {
        await refreshUser();
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, variables.communityCode);
      }
      form.reset();
    }
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">まずはログインしてください。</p>
      </Card>
    );
  }

  const badgeStatus = statusData?.status ?? 'UNAPPLIED';
  const statusErrorMessage = (statusError as ApiError | undefined)?.message ?? null;
  const combinedError = error ?? statusErrorMessage;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">コミュニティ参加</h1>
        <p className="mt-2 text-sm text-slate-500">管理者から共有されたコードで参加申請してください。</p>
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">現在のステータス</p>
            <p className="text-xl font-semibold text-slate-900">{statusData?.communityName ?? 'KING'}</p>
          </div>
          <StatusPill status={badgeStatus} />
        </div>
        <ErrorBanner message={combinedError} />
        <form
          className="mt-6 space-y-5"
          onSubmit={form.handleSubmit(async (values) => {
            setError(null);
            try {
              await joinMutation.mutateAsync(values);
            } catch (err: any) {
              setError(err?.message ?? '申請に失敗しました');
            }
          })}
        >
          <Field label="8桁のコミュニティコード" error={form.formState.errors.communityCode?.message}>
            <Input placeholder="ABCD1234" maxLength={8} {...form.register('communityCode')} />
          </Field>
          <Button type="submit" disabled={joinMutation.isPending || isFetching} className="w-full">
            {joinMutation.isPending ? '送信中...' : badgeStatus === 'UNAPPLIED' ? '参加申請する' : '再申請する'}
          </Button>
        </form>
        {showDevShortcut ? (
          <div className="mt-4 rounded-2xl border border-dashed border-orange-200 bg-orange-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">開発モード</p>
            <p className="mt-1">承認状態を即時テストしたい場合は以下を利用してください。</p>
            <Button
              type="button"
              variant="ghost"
              className="mt-3 border border-orange-200"
              disabled={devLoading}
              onClick={async () => {
                if (!DEV_APPROVE_ENDPOINT || !token) return;
                setDevLoading(true);
                setError(null);
                try {
                  await triggerDevApprove(token);
                  await refetch();
                  await refreshUser();
                } catch (err: any) {
                  setError(err?.message ?? '承認モードの呼び出しに失敗しました');
                } finally {
                  setDevLoading(false);
                }
              }}
            >
              {devLoading ? '更新中...' : '開発用: 即承認する'}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

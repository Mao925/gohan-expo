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

export default function CommunityJoinPage() {
  const { token, refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { communityName: '', communityCode: '' }
  });

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
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(variables));
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
  const showCommunityName = badgeStatus === 'APPROVED' && statusData?.communityName;

  return (
    <div className="mx-auto max-w-4xl md:max-w-5xl space-y-6 md:space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">コミュニティ参加</h1>
        <p className="mt-2 text-sm text-slate-500">管理者から共有されたコードで参加申請してください。</p>
      </div>
      <Card className="space-y-6 p-5 md:grid md:grid-cols-[1.1fr,1.4fr] md:items-start md:gap-6 md:space-y-0 md:p-6">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">現在のステータス</p>
          {showCommunityName ? (
            <p className="text-xl font-semibold text-slate-900">{statusData!.communityName}</p>
          ) : (
            <p className="text-base text-slate-400">承認済みになるとコミュニティ名が表示されます</p>
          )}
          <StatusPill status={badgeStatus} />
        </div>
        <div className="space-y-5">
          <ErrorBanner message={combinedError} />
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
            <Button type="submit" disabled={joinMutation.isPending || isFetching} className="w-full">
              {joinMutation.isPending ? '送信中...' : badgeStatus === 'UNAPPLIED' ? '参加申請する' : '再申請する'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

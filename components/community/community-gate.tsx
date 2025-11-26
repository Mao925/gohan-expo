'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { useCommunitySelfStatus } from '@/hooks/use-community-self-status';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';

type CommunityGateProps = {
  children: ReactNode;
};

// Centralized guard that shows a unified card for NO_COMMUNITY / PENDING users.
export function CommunityGate({ children }: CommunityGateProps) {
  const { token } = useAuth();
  const { data, isLoading, isFetching, error, refetch } = useCommunitySelfStatus(Boolean(token));

  const apiError = error as ApiError | undefined;

  if (!token) {
    return (
      <CommunityNoticeCard
        title="ログインが必要です"
        description="この機能を利用するには、まずログインしてください。"
        action={{ label: 'ログインへ', href: '/login' }}
      />
    );
  }

  if (isLoading) {
    return (
      <CommunityNoticeCard
        title="ステータスを確認しています"
        description="コミュニティの状態を読み込み中です。少しお待ちください。"
        loading
      />
    );
  }

  if (apiError?.status === 401) {
    return (
      <CommunityNoticeCard
        title="ログインが必要です"
        description="コミュニティに参加するには、まずログインしてください。"
        action={{ label: 'ログインへ', href: '/login' }}
      />
    );
  }

  if (!data) {
    return (
      <CommunityNoticeCard
        title="ステータスを取得できませんでした"
        description={apiError?.message ?? '時間をおいて再度お試しください。'}
        action={{
          label: isFetching ? '確認中...' : '再読み込み',
          onClick: () => refetch(),
          disabled: isFetching
        }}
      />
    );
  }

  if (data.isAdmin || data.phase === 'APPROVED') {
    return <>{children}</>;
  }

  if (data.phase === 'NO_COMMUNITY') {
    return (
      <CommunityNoticeCard
        title="コミュニティに参加するとこの機能が使えます"
        description="管理者から共有されたコミュニティコードを入力して、参加申請を行ってください。"
        action={{ label: 'コミュニティに参加する', href: '/community/join' }}
      />
    );
  }

  if (data.phase === 'PENDING') {
    return (
      <CommunityNoticeCard
        title={`${data.community?.name ?? 'コミュニティ'} に申請中です`}
        description="管理者が承認すると、この画面から各機能を利用できるようになります。しばらくお待ちください。"
        action={{
          label: isFetching ? '確認中...' : '最新の状態を確認',
          onClick: () => refetch(),
          disabled: isFetching
        }}
      />
    );
  }

  return null;
}

type NoticeAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

type CommunityNoticeCardProps = {
  title: string;
  description?: string;
  action?: NoticeAction;
  children?: ReactNode;
  loading?: boolean;
};

export function CommunityNoticeCard({ title, description, action, children, loading }: CommunityNoticeCardProps) {
  const content = (
    <Card className="space-y-4 border border-orange-100 bg-white/80 p-6 text-center shadow-sm">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-500">Community</p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {description ? <p className="text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
      {action ? (
        action.href ? (
          <Button asChild disabled={action.disabled || loading} className="w-full sm:w-auto">
            <Link href={action.href}>{loading ? '読み込み中...' : action.label}</Link>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={action.onClick}
            disabled={action.disabled || loading}
            className="w-full sm:w-auto"
          >
            {loading ? '読み込み中...' : action.label}
          </Button>
        )
      ) : null}
    </Card>
  );

  return <div className="mx-auto max-w-3xl">{content}</div>;
}

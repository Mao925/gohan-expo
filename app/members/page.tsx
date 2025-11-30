'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { MemberCard } from '@/components/member-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth-context';
import { ApiError, deleteMember, fetchMembers, updateLikeChoice } from '@/lib/api';
import { Member } from '@/lib/types';

type LikeChoice = 'YES' | 'NO';
type UpdatingState = { memberId: string; choice: LikeChoice } | null;

export default function MembersPage() {
  return (
    <CommunityGate>
      <MembersContent />
    </CommunityGate>
  );
}

function MembersContent() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const { data, isPending, error, refetch } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: fetchMembers,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingState, setUpdatingState] = useState<UpdatingState>(null);

  useEffect(() => {
    if (data) {
      setMembers(data);
    }
  }, [data]);

  const isInitialLoading = isPending && members.length === 0;
  const apiErrorMessage = (error as ApiError | undefined)?.message ?? null;
  const friendlyApiError =
    apiErrorMessage === 'Missing Authorization header' ? 'ログインし直してください' : apiErrorMessage;
  const errorMessage = actionError ?? friendlyApiError;

  const handleToggleLike = async (memberId: string, nextStatus: LikeChoice) => {
    const targetMember = members.find((item) => item.id === memberId);
    if (!targetMember) return;
    if (targetMember.myLikeStatus === nextStatus) return;
    if (targetMember.isMutualLike && nextStatus === 'NO') return;

    const previousStatus = targetMember.myLikeStatus ?? 'NO';
    setActionError(null);
    setUpdatingState({ memberId, choice: nextStatus });
    setMembers((prev) =>
      prev.map((item) =>
        item.id === memberId ? { ...item, myLikeStatus: nextStatus } : item
      )
    );

    try {
      const response = await updateLikeChoice(memberId, nextStatus);
      setMembers((prev) =>
        prev.map((item) =>
          item.id === memberId
            ? { ...item, myLikeStatus: response.myLikeStatus, isMutualLike: response.isMutualLike }
            : item
        )
      );
    } catch (err: any) {
      setActionError(err?.message ?? '回答の更新に失敗しました');
      setMembers((prev) =>
        prev.map((item) =>
          item.id === memberId ? { ...item, myLikeStatus: previousStatus } : item
        )
      );
    } finally {
      setUpdatingState(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('このユーザーを削除しますか？')) return;
    setActionError(null);
    try {
      await deleteMember(userId);
      setMembers((prev) => prev.filter((member) => member.id !== userId));
    } catch (err: any) {
      setActionError(err?.message ?? 'ユーザーの削除に失敗しました');
    }
  };

  const handleRefresh = () => {
    setActionError(null);
    return refetch();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">承認済みメンバー</h1>
            <p className="text-sm text-slate-500">
              コミュニティ内の全メンバーをフラットに表示し、ここで YES / NO を切り替えられます。
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="min-w-[96px]"
          >
            {isPending ? '更新中...' : '更新'}
          </Button>
        </div>
      </div>

      <ErrorBanner message={errorMessage} />

      {isInitialLoading ? (
        <Card className="flex items-center justify-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          <p className="text-sm text-slate-500">読み込み中...</p>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">まだ表示できるメンバーがいません。</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              onToggleLike={(nextStatus) => handleToggleLike(member.id, nextStatus)}
              onDeleteUser={isAdmin ? () => handleDeleteUser(member.id) : undefined}
              isUpdating={updatingState?.memberId === member.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

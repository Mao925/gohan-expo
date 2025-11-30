'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CommunityGate } from '@/components/community/community-gate';
import { ErrorBanner } from '@/components/error-banner';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { ApiError, fetchMembers, updateLikeChoice } from '@/lib/api';
import { Member } from '@/lib/types';
import { cn } from '@/lib/utils';

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
  const { data, isPending, error, refetch } = useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: fetchMembers
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

  const handleChoice = useCallback(async (member: Member, choice: LikeChoice) => {
    if (member.myLikeStatus === choice) return;
    setActionError(null);
    setUpdatingState({ memberId: member.id, choice });
    try {
      const response = await updateLikeChoice(member.id, choice);
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id
            ? { ...item, myLikeStatus: response.myLikeStatus, isMutualLike: response.isMutualLike }
            : item
        )
      );
    } catch (err: any) {
      setActionError(err?.message ?? '回答の更新に失敗しました');
    } finally {
      setUpdatingState(null);
    }
  }, []);

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
            <MemberRow
              key={member.id}
              member={member}
              onChoice={handleChoice}
              updatingState={updatingState}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type MemberRowProps = {
  member: Member;
  onChoice: (member: Member, choice: LikeChoice) => void;
  updatingState: UpdatingState;
};

function MemberRow({ member, onChoice, updatingState }: MemberRowProps) {
  const isUpdatingMember = updatingState?.memberId === member.id;
  const updatingChoice = isUpdatingMember ? updatingState?.choice : null;
  const isYesActive = member.myLikeStatus === 'YES';
  const isNoActive = member.myLikeStatus === 'NO';
  const showMatchHint = member.isMutualLike;

  return (
    <Card className="border-orange-100">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar imageUrl={member.profileImageUrl ?? undefined} name={member.name ?? '名前未設定'} size="md" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{member.name ?? '名前未設定'}</p>
                {member.isMutualLike ? <Badge variant="secondary">マッチ済み</Badge> : null}
              </div>
              <FavoriteMealsList meals={member.favoriteMeals} variant="pill" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  'rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition',
                  isYesActive
                    ? 'border border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
                onClick={() => onChoice(member, 'YES')}
                disabled={isUpdatingMember}
              >
                {isUpdatingMember && updatingChoice === 'YES' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'YES'
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(
                  'rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition',
                  isNoActive
                    ? 'border border-red-400 bg-red-400 text-white hover:bg-red-500'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                )}
                onClick={() => onChoice(member, 'NO')}
                disabled={isUpdatingMember || member.isMutualLike}
                title={member.isMutualLike ? 'マッチ済みの相手にはNOを選べません' : undefined}
              >
                {isUpdatingMember && updatingChoice === 'NO' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'NO'
                )}
              </Button>
            </div>
            {showMatchHint ? (
              <p className="text-xs text-slate-500">マッチ済みのため NO を選択できません</p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

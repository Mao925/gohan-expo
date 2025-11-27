'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { CommunityGate } from '@/components/community/community-gate';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { MemberCard } from '@/components/member-card';
import { ErrorBanner } from '@/components/error-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { ApiError, apiFetch } from '@/lib/api';
import { Member, MemberRelationship, MemberRelationshipsResponse, Profile } from '@/lib/types';

type RelationshipLists = {
  matches: MemberRelationship[];
  awaitingResponse: MemberRelationship[];
  rejected: MemberRelationship[];
};

export default function MembersPage() {
  return (
    <CommunityGate>
      <MembersContent />
    </CommunityGate>
  );
}

function MembersContent() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const isAdminUser = Boolean(user?.isAdmin);
  const [relationshipLists, setRelationshipLists] = useState<RelationshipLists>({
    matches: [],
    awaitingResponse: [],
    rejected: []
  });

  const getTargetUserId = useCallback((member: MemberRelationship | null | undefined) => {
    if (!member) return null;
    return member.targetUserId ?? null;
  }, []);

  const {
    data: membersData,
    isPending: membersPending,
    refetch: refetchMembers
  } = useQuery<Member[]>({
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
    enabled: Boolean(token && isAdminUser)
  });

  const { data: profileData } = useQuery<Profile>({
    queryKey: ['profile', token],
    queryFn: async () => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<Profile>('/api/profile', { token });
    },
    enabled: Boolean(token)
  });

  const {
    data: relationshipsData,
    isPending: relationshipsPending,
    refetch: refetchRelationships
  } = useQuery<MemberRelationshipsResponse>({
    queryKey: ['member-relationships', token],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch<MemberRelationshipsResponse>('/api/members/relationships', { token });
      } catch (err: any) {
        setError(err?.message ?? '取得に失敗しました');
        throw err;
      }
    },
    enabled: Boolean(token && !isAdminUser)
  });

  useEffect(() => {
    if (!relationshipsData) return;
    if (process.env.NODE_ENV !== 'production') {
      console.log('relationshipsData', relationshipsData);
    }
    setRelationshipLists({
      matches: relationshipsData.matches ?? [],
      awaitingResponse: relationshipsData.awaitingResponse ?? [],
      rejected: relationshipsData.rejected ?? []
    });
  }, [relationshipsData]);

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
      await refetchMembers();
    },
    onError: (err: any) => setPendingMessage(err?.message ?? 'メンバーの削除に失敗しました')
  });

  type TogglePayload = { targetUserId: string; relationshipId?: string; answer: 'YES' | 'NO' };
  type ToggleResponse = { matched?: boolean; member?: MemberRelationship };

  const moveRelationshipMember = useCallback(
    (identifier: string, destination: keyof RelationshipLists, override?: MemberRelationship) => {
      setRelationshipLists((prev) => {
        let nextMember = override;
        const removeFrom = (list: MemberRelationship[]) =>
          list.filter((member) => {
            const memberIdentifier = member.id ?? member.targetUserId;
            if (memberIdentifier === identifier) {
              if (!nextMember) {
                nextMember = member;
              }
              return false;
            }
            return true;
          });
        const nextLists: RelationshipLists = {
          matches: removeFrom(prev.matches),
          awaitingResponse: removeFrom(prev.awaitingResponse),
          rejected: removeFrom(prev.rejected)
        };
        if (nextMember) {
          nextLists[destination] = [nextMember, ...nextLists[destination]];
        }
        return nextLists;
      });
    },
    []
  );

  const toggleRelationshipMutation = useMutation<ToggleResponse, unknown, TogglePayload>({
    mutationFn: async ({ targetUserId, answer }) => {
      if (!token) throw new Error('ログインしてください');
      return apiFetch<ToggleResponse>(`/api/like/${targetUserId}`, {
        method: 'PATCH',
        data: { answer },
        token
      });
    },
    onSuccess: async (data, variables) => {
      setError(null);
      if (variables.answer === 'YES') {
        setPendingMessage(data?.matched ? 'YESに変更し、マッチ一覧へ移動しました！' : 'YESに変更しました。');
      } else {
        setPendingMessage('NOに変更しました。');
      }
      const promises: Promise<unknown>[] = [];
      if (!isAdminUser) {
        const destination: keyof RelationshipLists =
          variables.answer === 'NO' ? 'rejected' : data?.matched ? 'matches' : 'awaitingResponse';
        const identifier = variables.relationshipId ?? variables.targetUserId;
        moveRelationshipMember(identifier, destination, data?.member);
        promises.push(refetchRelationships());
      }
      if (variables.answer === 'YES') {
        promises.push(queryClient.invalidateQueries({ queryKey: ['matches', token] }));
      }
      await Promise.all(promises);
    },
    onError: (err) => {
      setPendingMessage(null);
      const apiError = err as ApiError | undefined;
      if (process.env.NODE_ENV !== 'production') {
        console.error('toggleRelationship failed', { error: err, variables: toggleRelationshipMutation.variables });
      }
      setError(apiError?.message ?? '回答の更新に失敗しました');
    }
  });

  const isRelationshipView = !isAdminUser;
  const isListLoading = isRelationshipView ? relationshipsPending : membersPending;

  const handleRefresh = () => {
    if (isRelationshipView) {
      return refetchRelationships();
    }
    return refetchMembers();
  };

  const relationshipAwaitingResponse = relationshipLists.awaitingResponse;
  const relationshipRejected = relationshipLists.rejected;
  const myFavoriteMeals =
    membersData?.find((member) => member.isSelf)?.favoriteMeals ?? profileData?.favoriteMeals ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-slate-900">承認済みメンバー</h1>
          <button className="text-sm text-slate-500 underline-offset-4 hover:underline" onClick={() => handleRefresh()}>
            更新
          </button>
        </div>
        <p className="text-sm text-slate-500">
          {isRelationshipView ? 'マッチ状況や YES / NO の回答履歴を確認できます。' : '同じコミュニティで承認済みのメンバーだけが表示されます。'}
        </p>
      </div>
      <ErrorBanner message={pendingMessage ?? error} />
      {isListLoading ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : isRelationshipView ? (
        <div className="space-y-8">
          <RelationshipSection
            title="回答待ち（自分は YES）"
            description="あなたは YES 済みで、相手の回答を待っている一覧です。"
            emptyMessage="現在は回答待ちの相手がいません。"
            members={relationshipAwaitingResponse}
            highlightMeals={myFavoriteMeals}
            renderAction={(member) => {
              const targetId = getTargetUserId(member);
              if (!member.canToggleToNo || !targetId) return null;
              const isUpdating =
                toggleRelationshipMutation.isPending &&
                toggleRelationshipMutation.variables?.targetUserId === targetId;
              if (process.env.NODE_ENV !== 'production' && !member.targetUserId) {
                console.warn('Missing targetUserId for member, disabling NO toggle', member);
              }
              return (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                  onClick={() =>
                    toggleRelationshipMutation.mutate({
                      targetUserId: targetId,
                      relationshipId: member.id,
                      answer: 'NO'
                    })
                  }
                  disabled={isUpdating}
                >
                  {isUpdating ? '更新中...' : 'NOに変更'}
                </Button>
              );
            }}
          />
          <RelationshipSection
            title="自分が NO にした相手"
            description="以前 NO を選んだ相手です。必要なら YES に戻せます。"
            emptyMessage="NO にした相手はいません。"
            members={relationshipRejected}
            highlightMeals={myFavoriteMeals}
            renderAction={(member) => {
              const targetId = getTargetUserId(member);
              if (!member.canToggleToYes || !targetId) return null;
              const isUpdating =
                toggleRelationshipMutation.isPending &&
                toggleRelationshipMutation.variables?.targetUserId === targetId;
              if (process.env.NODE_ENV !== 'production' && !member.targetUserId) {
                console.warn('Missing targetUserId for member, disabling YES toggle', member);
              }
              return (
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white hover:bg-brand/90"
                  onClick={() =>
                    toggleRelationshipMutation.mutate({
                      targetUserId: targetId,
                      relationshipId: member.id,
                      answer: 'YES'
                    })
                  }
                  disabled={isUpdating}
                >
                  {isUpdating ? '更新中...' : 'YESに変更'}
                </Button>
              );
            }}
          />
        </div>
      ) : membersData && membersData.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {membersData.map((member) => {
            const removableProps =
              isAdminUser && !member.isSelf
                ? {
                    canRemove: true,
                    onRemove: (id: string) => removeMemberMutation.mutate(id)
                  }
                : undefined;
            return <MemberCard key={member.id} member={member} myFavoriteMeals={myFavoriteMeals} {...(removableProps ?? {})} />;
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

type RelationshipSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  members: MemberRelationship[];
  highlightMeals?: string[];
  renderAction?: (member: MemberRelationship) => ReactNode;
  renderDetail?: (member: MemberRelationship) => ReactNode;
};

function RelationshipSection({ title, description, emptyMessage, members, highlightMeals, renderAction, renderDetail }: RelationshipSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {members.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member, index) => {
            if (!member) return null;
            const identifier = member.id ?? member.targetUserId;
            if (!identifier) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('Relationship member is missing id/targetUserId. Skipping entry.', member);
              }
              return null;
            }
            return (
              <RelationshipCard
                key={identifier ?? `relationship-${index}`}
                member={member}
                highlightMeals={highlightMeals}
                action={renderAction ? renderAction(member) : null}
                detail={renderDetail ? renderDetail(member) : null}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </Card>
      )}
    </section>
  );
}

type RelationshipCardProps = {
  member: MemberRelationship;
  highlightMeals?: string[];
  action?: ReactNode;
  detail?: ReactNode;
};

function RelationshipCard({ member, highlightMeals, action, detail }: RelationshipCardProps) {
  return (
    <Card className="flex flex-col gap-3 border border-orange-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-slate-900">{member.name}</p>
        {action ? <div>{action}</div> : null}
      </div>
      <FavoriteMealsList meals={member.favoriteMeals} highlightMeals={highlightMeals} />
      {detail ? <div className="rounded-2xl bg-orange-50 px-4 py-3">{detail}</div> : null}
    </Card>
  );
}

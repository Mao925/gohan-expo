'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { MemberCard } from '@/components/member-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { ApiError, apiFetch } from '@/lib/api';
import { fetchOverlapAvailability } from '@/lib/api/availability';
import { formatAvailabilitySlot } from '@/lib/availability';
import { Member, MemberRelationship, MemberRelationshipsResponse, OverlapSlotDto } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useCommunityStatus } from '@/hooks/use-community-status';
import { FavoriteMealsList } from '@/components/favorite-meals-list';

type StoredJoin = {
  communityCode: string;
  communityName?: string;
};

type RelationshipLists = {
  matches: MemberRelationship[];
  awaitingResponse: MemberRelationship[];
  rejected: MemberRelationship[];
};

type OverlapState = {
  isLoading: boolean;
  slots: OverlapSlotDto[] | null;
  error: string | null;
};

const STORAGE_KEY = 'gohan_last_community_join';

export default function MembersPage() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [lastJoin, setLastJoin] = useState<StoredJoin | null>(null);
  const { data: statusData, isLoading: statusLoading, refetch: refetchStatus } = useCommunityStatus({ refetchInterval: 15000 });
  const isAdminUser = Boolean(user?.isAdmin);
  const [relationshipLists, setRelationshipLists] = useState<RelationshipLists>({
    matches: [],
    awaitingResponse: [],
    rejected: []
  });
  const [overlapStates, setOverlapStates] = useState<Record<string, OverlapState>>({});

  const getTargetUserId = useCallback((member: MemberRelationship | null | undefined) => {
    if (!member) return null;
    return member.targetUserId ?? null;
  }, []);

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
    enabled: Boolean(token && statusData?.status === 'APPROVED' && isAdminUser)
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
    enabled: Boolean(token && statusData?.status === 'APPROVED' && !isAdminUser)
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
      await Promise.all([refetchMembers(), refetchStatus()]);
    },
    onError: (err: any) => setPendingMessage(err?.message ?? 'メンバーの削除に失敗しました')
  });

  type TogglePayload = { targetUserId: string; relationshipId?: string; answer: 'YES' | 'NO' };
  type ToggleResponse = { matched?: boolean; member?: MemberRelationship };

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

  const handleCheckSchedule = useCallback(
    async (partnerUserId: string) => {
      setOverlapStates((prev) => ({
        ...prev,
        [partnerUserId]: { isLoading: true, slots: prev[partnerUserId]?.slots ?? null, error: null }
      }));
      try {
        const slots = await fetchOverlapAvailability(partnerUserId, token);
        setOverlapStates((prev) => ({
          ...prev,
          [partnerUserId]: { isLoading: false, slots, error: null }
        }));
      } catch (err) {
        const apiError = err as ApiError | undefined;
        let message = apiError?.message ?? '取得に失敗しました';
        if (apiError?.status === 403) {
          message = 'この相手の日程は参照できません';
        } else if (apiError?.status === 500) {
          message = 'サーバーエラーが発生しました';
        }
        setOverlapStates((prev) => ({
          ...prev,
          [partnerUserId]: { isLoading: false, slots: null, error: message }
        }));
      }
    },
    [token]
  );

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

  const isRelationshipView = !isAdminUser;
  const isListLoading = isRelationshipView ? relationshipsPending : membersPending;

  const handleRefresh = () => {
    if (isRelationshipView) {
      return refetchRelationships();
    }
    return refetchMembers();
  };

  const relationshipMatches = relationshipLists.matches;
  const relationshipAwaitingResponse = relationshipLists.awaitingResponse;
  const relationshipRejected = relationshipLists.rejected;

  return (
    <div className="space-y-6">
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
            title="マッチ一覧"
            description="両想いになったお相手です。"
            emptyMessage="まだマッチはありません。"
            members={relationshipMatches}
            renderAction={(member) => {
              const targetId = getTargetUserId(member);
              if (!targetId) return null;
              const state = overlapStates[targetId];
              const isLoading = Boolean(state?.isLoading);
              return (
                <Button type="button" size="sm" onClick={() => handleCheckSchedule(targetId)} disabled={isLoading}>
                  {isLoading ? '確認中...' : '日程を確認'}
                </Button>
              );
            }}
            renderDetail={(member) => {
              const targetId = getTargetUserId(member);
              if (!targetId) return null;
              const state = overlapStates[targetId];
              if (!state) return null;
              if (state.isLoading) {
                return <p className="text-sm text-slate-500">確認中...</p>;
              }
              if (state.error) {
                return <p className="text-sm font-semibold text-red-600">{state.error}</p>;
              }
              if (state.slots && state.slots.length === 0) {
                return <p className="text-sm text-slate-600">一致している日程がありません</p>;
              }
              if (state.slots && state.slots.length > 0) {
                return (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">共通の空き:</span>{' '}
                    {state.slots.map((slot) => formatAvailabilitySlot(slot.weekday, slot.timeSlot)).join(' / ')}
                  </p>
                );
              }
              return null;
            }}
          />
          <RelationshipSection
            title="回答待ち（自分は YES）"
            description="あなたは YES 済みで、相手の回答を待っている一覧です。"
            emptyMessage="現在は回答待ちの相手がいません。"
            members={relationshipAwaitingResponse}
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
        <div className="grid gap-4">
          {membersData.map((member) => {
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

type RelationshipSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  members: MemberRelationship[];
  renderAction?: (member: MemberRelationship) => ReactNode;
  renderDetail?: (member: MemberRelationship) => ReactNode;
};

function RelationshipSection({ title, description, emptyMessage, members, renderAction, renderDetail }: RelationshipSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {members.length > 0 ? (
        <div className="grid gap-4">
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
  action?: ReactNode;
  detail?: ReactNode;
};

function RelationshipCard({ member, action, detail }: RelationshipCardProps) {
  return (
    <Card className="flex flex-col gap-3 border border-orange-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-semibold text-slate-900">{member.name}</p>
        {action ? <div>{action}</div> : null}
      </div>
      <FavoriteMealsList meals={member.favoriteMeals} />
      {detail ? <div className="rounded-2xl bg-orange-50 px-4 py-3">{detail}</div> : null}
    </Card>
  );
}

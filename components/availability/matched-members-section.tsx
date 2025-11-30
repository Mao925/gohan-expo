'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { ErrorBanner } from '@/components/error-banner';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { apiFetch } from '@/lib/api';
import { MemberRelationship, MemberRelationshipsResponse } from '@/lib/types';

type MatchedMembersSectionProps = {
  onSelectMember: (member: MemberRelationship) => void;
  highlightMeals?: string[];
  showHeader?: boolean;
};

export function MatchedMembersSection({
  onSelectMember,
  highlightMeals,
  showHeader = true
}: MatchedMembersSectionProps) {
  const { token, user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { data, isPending } = useQuery<MemberRelationshipsResponse>({
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
    enabled: Boolean(token && !user?.isAdmin)
  });

  const matches = data?.matches ?? [];

  return (
    <section className="mt-10 space-y-4">
      {showHeader && (
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-slate-900">マッチしたメンバー</h2>
          <p className="text-xs text-slate-500">GO / STAY の予定を確認できます。</p>
        </div>
      )}

      <ErrorBanner message={error} />

      {isPending ? (
        <Card className="bg-white/70 p-4 text-sm text-slate-500">マッチしたメンバーを読み込み中です...</Card>
      ) : matches.length === 0 ? (
        <Card className="bg-white/70 p-4 text-sm text-slate-500">まだマッチしたメンバーはいません。</Card>
      ) : (
        <div className="space-y-3">
          {matches.map((member) => {
            const key = member.id ?? member.targetUserId ?? member.name;
            return (
              <Card
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => onSelectMember(member)}
                className="group relative flex cursor-pointer items-center justify-between gap-3 border border-orange-100 bg-white/80 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold text-slate-900">{member.name}</p>
                  <FavoriteMealsList meals={member.favoriteMeals} highlightMeals={highlightMeals} className="mt-2" />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectMember(member);
                  }}
                >
                  日程を合わせる
                </Button>
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-orange-300 transition group-hover:text-orange-400">
                  <ChevronRight className="h-5 w-5" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

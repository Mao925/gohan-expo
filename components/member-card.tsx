"use client";

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { formatBudgetLabel } from '@/lib/api';
import { Member } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Heart, Loader2, Star } from 'lucide-react';
import {
  DRINKING_STYLE_LABELS,
  MEAL_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS,
} from '@/lib/profile-labels';

type MemberCardProps = {
  member: Member;
  isAdmin?: boolean;
  onLike?: (memberId: string) => Promise<void> | void;
  onDeleteUser?: () => void;
  isUpdating?: boolean;
  isSuperLikeLoading?: boolean;
  onSuperLike?: (memberId: string) => Promise<void> | void;
  showMatchBadge?: boolean;
  reactionLink?: string;
};

export function MemberCard({
  member,
  isAdmin,
  onLike,
  onDeleteUser,
  isUpdating,
  isSuperLikeLoading,
  onSuperLike,
  showMatchBadge = true,
  reactionLink,
}: MemberCardProps) {
  const profile = member.profile ?? null;
  const name = profile?.name ?? member.name ?? '名前未設定';
  const budgetLabel = profile?.defaultBudget ? formatBudgetLabel(profile.defaultBudget) : null;
  const drinkingLabel = profile?.drinkingStyle ? DRINKING_STYLE_LABELS[profile.drinkingStyle] : null;
  const mealStyleLabel = profile?.mealStyle ? MEAL_STYLE_LABELS[profile.mealStyle] : null;
  const frequencyLabel = profile?.goMealFrequency ? GO_MEAL_FREQUENCY_LABELS[profile.goMealFrequency] : null;
  const preferenceBadges = [budgetLabel, drinkingLabel, mealStyleLabel, frequencyLabel].filter(
    Boolean
  ) as string[];
  const ngFoods = profile?.ngFoods ?? [];
  const canShowSuperLikeButton = !isAdmin;
  const likedByMe = Boolean(member.likedByMe);
  const superLikedByMe = Boolean(member.superLikedByMe);
  const isHeartActive = likedByMe && !superLikedByMe;
  const isStarActive = superLikedByMe;
  const likeButtonDisabled = Boolean(isUpdating);
  const superLikeDisabled = Boolean(isSuperLikeLoading || !onSuperLike);

  const likeButtonClass = cn(
    'flex h-12 w-12 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isHeartActive
      ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:ring-red-300'
      : 'border-slate-200 bg-white text-slate-400 hover:bg-slate-50 focus-visible:ring-slate-300',
    likeButtonDisabled && 'cursor-not-allowed opacity-70'
  );

  const superLikeButtonClass = cn(
    'flex h-12 w-12 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
    isStarActive
      ? 'border-yellow-200 bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus-visible:ring-yellow-300'
      : 'border-slate-200 bg-white text-slate-300 hover:bg-slate-50 focus-visible:ring-slate-300',
    superLikeDisabled && 'cursor-not-allowed opacity-70'
  );

  return (
    <Card className="border-orange-100">
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar
              imageUrl={profile?.profileImageUrl ?? member.profileImageUrl ?? undefined}
              name={name}
              size="md"
            />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{name}</p>
                {showMatchBadge && member.isMutualLike ? (
                  <Badge variant="secondary">マッチ済み</Badge>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-4 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                onClick={onDeleteUser}
              >
                ユーザー削除
              </Button>
            )}
            {isAdmin && reactionLink && (
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              >
                <Link href={reactionLink}>リアクション一覧</Link>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
            >
              <Link href={`/members/${member.id}/profile`}>Profile</Link>
            </Button>
          </div>
          {preferenceBadges.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {preferenceBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {badge}
                </span>
              ))}
            </div>
          )}
          {ngFoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-rose-600">NG:</span>
              {ngFoods.map((food) => (
                <span
                  key={food}
                  className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600"
                >
                  {food}
                </span>
              ))}
            </div>
          )}
        </div>

        {!isAdmin && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={likeButtonClass}
              onClick={() => onLike?.(member.id)}
              disabled={likeButtonDisabled}
            >
              {isUpdating ? (
                <Loader2 className="h-5 w-5 animate-spin text-current" />
              ) : (
                <Heart className="h-6 w-6 transition-colors duration-200" fill={isHeartActive ? 'currentColor' : 'none'} />
              )}
              <span className="sr-only">{isHeartActive ? 'いいねを外す' : 'いいねする'}</span>
            </button>
            {canShowSuperLikeButton && (
              <button
                type="button"
                className={superLikeButtonClass}
                onClick={() => onSuperLike?.(member.id)}
                disabled={superLikeDisabled}
              >
                {isSuperLikeLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-current" />
                ) : (
                  <Star
                    className="h-6 w-6 transition-colors duration-200"
                    fill={isStarActive ? 'currentColor' : 'none'}
                  />
                )}
                <span className="sr-only">
                  {isStarActive ? 'スーパーいいねを取り消す' : 'スーパーいいねを送る'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

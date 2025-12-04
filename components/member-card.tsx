"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { FavoriteMealsList } from './favorite-meals-list';
import { LikeToggleButton } from './like-toggle-button';
import { formatBudgetLabel } from '@/lib/api';
import { LikeStatus, Member } from '@/lib/types';
import {
  DRINKING_STYLE_LABELS,
  MEAL_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS
} from '@/lib/profile-labels';

type MemberCardProps = {
  member: Member;
  isAdmin?: boolean;
  onToggleLike?: (memberId: string, currentStatus: LikeStatus) => void;
  onDeleteUser?: () => void;
  isUpdating?: boolean;
  onViewProfile?: (userId: string) => void;
};

export function MemberCard({
  member,
  isAdmin,
  onToggleLike,
  onDeleteUser,
  isUpdating,
  onViewProfile
}: MemberCardProps) {
  const effectiveStatus: LikeStatus = member.myLikeStatus ?? 'NONE';
  const profile = member.profile ?? null;
  const name = profile?.name ?? member.name ?? '名前未設定';
  const favoriteMeals = profile?.favoriteMeals ?? member.favoriteMeals ?? [];
  const locationLabel = profile?.mainArea;
  const subAreas = profile?.subAreas ?? [];
  const budgetLabel = profile?.defaultBudget ? formatBudgetLabel(profile.defaultBudget) : null;
  const drinkingLabel = profile?.drinkingStyle ? DRINKING_STYLE_LABELS[profile.drinkingStyle] : null;
  const mealStyleLabel = profile?.mealStyle ? MEAL_STYLE_LABELS[profile.mealStyle] : null;
  const frequencyLabel = profile?.goMealFrequency ? GO_MEAL_FREQUENCY_LABELS[profile.goMealFrequency] : null;
  const preferenceBadges = [budgetLabel, drinkingLabel, mealStyleLabel, frequencyLabel].filter(
    Boolean
  ) as string[];
  const ngFoods = profile?.ngFoods ?? [];

  return (
    <Card className="border-orange-100">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar
              imageUrl={profile?.profileImageUrl ?? member.profileImageUrl ?? undefined}
              name={name}
              size="md"
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{name}</p>
                {member.isMutualLike ? <Badge variant="secondary">マッチ済み</Badge> : null}
              </div>
              {locationLabel ? (
                <p className="text-sm text-slate-500">{locationLabel}</p>
              ) : (
                <p className="text-sm text-slate-400">エリア未設定</p>
              )}
              {subAreas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {subAreas.map((area) => (
                    <span key={area} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {area}
                    </span>
                  ))}
                </div>
              )}
              {preferenceBadges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {preferenceBadges.map((badge) => (
                    <span key={badge} className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-700">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
              <FavoriteMealsList meals={favoriteMeals} variant="pill" />
              {ngFoods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-semibold text-rose-600">NG:</span>
                  {ngFoods.map((food) => (
                    <span key={food} className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">
                      {food}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end justify-center gap-2">
            {isAdmin ? (
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full px-4 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                  onClick={onDeleteUser}
                >
                  ユーザー削除
                </Button>
                {onViewProfile ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    onClick={() => onViewProfile(member.id)}
                  >
                    Profile
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LikeToggleButton
                  status={effectiveStatus}
                  onClick={() => onToggleLike?.(member.id, effectiveStatus)}
                  disabled={isUpdating}
                  isLoading={isUpdating}
                />
                {onViewProfile ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    onClick={() => onViewProfile(member.id)}
                  >
                    Profile
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ProfileAvatar } from '@/components/profile-avatar';
import { FavoriteMealsList } from './favorite-meals-list';
import { LikeToggleButton } from './like-toggle-button';
import { Member } from '@/lib/types';

type LikeChoice = 'YES' | 'NO';

type MemberCardProps = {
  member: Member;
  isAdmin?: boolean;
  onToggleLike?: (nextStatus: LikeChoice) => void;
  onDeleteUser?: () => void;
  isUpdating?: boolean;
};

export function MemberCard({
  member,
  isAdmin,
  onToggleLike,
  onDeleteUser,
  isUpdating,
}: MemberCardProps) {
  const status = member.myLikeStatus ?? 'NO';
  const disableToggle = member.isMutualLike;

  return (
    <Card className="border-orange-100">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ProfileAvatar
              imageUrl={member.profileImageUrl ?? undefined}
              name={member.name ?? '名前未設定'}
              size="md"
            />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-slate-900">{member.name ?? '名前未設定'}</p>
                {member.isMutualLike ? <Badge variant="secondary">マッチ済み</Badge> : null}
              </div>
              <FavoriteMealsList meals={member.favoriteMeals} variant="pill" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isAdmin ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full px-4 py-1 text-xs font-semibold bg-red-500 text-white hover:bg-red-600"
                onClick={onDeleteUser}
              >
                ユーザー削除
              </Button>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <LikeToggleButton
                  status={status}
                  onToggle={(nextStatus) => onToggleLike?.(nextStatus)}
                  disabled={disableToggle}
                  isLoading={isUpdating}
                />
                {member.isMutualLike ? (
                  <p className="text-xs text-slate-500">マッチ済みのため NO を選択できません</p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

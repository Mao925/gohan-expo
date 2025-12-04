"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Heart } from "lucide-react";
import { CommunityGate } from "@/components/community/community-gate";
import { ErrorBanner } from "@/components/error-banner";
import { MemberCard } from "@/components/member-card";
import { FavoriteMealsList } from "@/components/favorite-meals-list";
import { ProfileAvatar } from "@/components/profile-avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  deleteMember,
  fetchMembers,
  fetchPublicUserProfile,
  LikeAnswer,
  PublicUserProfile,
  updateLikeStatus,
} from "@/lib/api";
import { LikeStatus, Member } from "@/lib/types";
import {
  DRINKING_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS,
  MEAL_STYLE_LABELS,
} from "@/lib/profile-labels";

type UpdatingState = { memberId: string } | null;
type ProfileDialogState = "idle" | "loading" | "loaded" | "notFound" | "error";

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
    queryKey: ["members"],
    queryFn: fetchMembers,
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingState, setUpdatingState] = useState<UpdatingState>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileState, setProfileState] = useState<ProfileDialogState>("idle");
  const [selectedProfile, setSelectedProfile] = useState<PublicUserProfile | null>(null);
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMembers(data ?? []);
  }, [data]);

  const isInitialLoading = isPending && members.length === 0;
  const apiErrorMessage = (error as ApiError | undefined)?.message ?? null;
  const friendlyApiError =
    apiErrorMessage === "Missing Authorization header"
      ? "ログインし直してください"
      : apiErrorMessage;
  const errorMessage = actionError ?? friendlyApiError;
  const drinkingStyleLabel = selectedProfile?.drinkingStyle
    ? DRINKING_STYLE_LABELS[
        selectedProfile.drinkingStyle as keyof typeof DRINKING_STYLE_LABELS
      ] ?? selectedProfile.drinkingStyle
    : null;
  const mealStyleLabel = selectedProfile?.mealStyle
    ? MEAL_STYLE_LABELS[
        selectedProfile.mealStyle as keyof typeof MEAL_STYLE_LABELS
      ] ?? selectedProfile.mealStyle
    : null;
  const frequencyLabel = selectedProfile?.goMealFrequency
    ? GO_MEAL_FREQUENCY_LABELS[
        selectedProfile.goMealFrequency as keyof typeof GO_MEAL_FREQUENCY_LABELS
      ] ?? selectedProfile.goMealFrequency
    : null;

  const handleToggleLike = async (memberId: string, currentStatus: LikeStatus) => {
    if (updatingState?.memberId === memberId) return;
    const targetMember = members.find((item) => item.id === memberId);
    if (!targetMember) return;

    const nextAnswer: LikeAnswer = currentStatus === "YES" ? "NO" : "YES";
    const previousStatus = targetMember.myLikeStatus ?? "NONE";
    const previousIsMutual = targetMember.isMutualLike;

    setActionError(null);
    setUpdatingState({ memberId });
    setMembers((prev) =>
      prev.map((item) =>
        item.id === memberId
          ? {
              ...item,
              myLikeStatus: nextAnswer,
              isMutualLike: nextAnswer === "YES" ? item.isMutualLike : false,
            }
          : item
      )
    );

    try {
      await updateLikeStatus(memberId, nextAnswer);
    } catch (err: any) {
      console.error("Failed to update like status", err);
      setActionError("いいねの送信に失敗しました。通信環境を確認して再度お試しください。");
      setMembers((prev) =>
        prev.map((item) =>
          item.id === memberId
            ? {
                ...item,
                myLikeStatus: previousStatus,
                isMutualLike: previousIsMutual,
              }
            : item
        )
      );
    } finally {
      setUpdatingState(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("このユーザーを削除しますか？")) return;
    setActionError(null);
    try {
      await deleteMember(userId);
      setMembers((prev) => prev.filter((member) => member.id !== userId));
    } catch (err: any) {
      console.error("Failed to delete member", err);
      if (err?.status === 404) {
        setActionError("対象メンバーが見つかりません");
      } else if (err?.status === 403) {
        setActionError("ユーザー削除の権限がありません");
      } else if (err?.status === 400) {
        setActionError(err?.message ?? "ユーザーの削除に失敗しました");
      } else {
        setActionError(err?.message ?? "ユーザーの削除に失敗しました");
      }
    }
  };

  const handleOpenProfile = useCallback(async (userId: string) => {
    setIsProfileOpen(true);
    setProfileState("loading");
    setSelectedProfile(null);
    setProfileErrorMessage(null);

    try {
      const profile = await fetchPublicUserProfile(userId);
      setSelectedProfile(profile);
      setProfileState("loaded");
    } catch (error: any) {
      const statusCode = Number(error?.code ?? error?.status ?? 0);
      if (statusCode === 401) {
        setProfileState("error");
        setProfileErrorMessage(
          "ログインの有効期限が切れた可能性があります。再度ログインし直してください。"
        );
      } else if (statusCode === 404 || statusCode === 400) {
        setProfileState("notFound");
        setProfileErrorMessage("このメンバーのプロフィールは表示できません。");
      } else {
        setProfileState("error");
        setProfileErrorMessage("プロフィールの取得に失敗しました。時間をおいて再度お試しください。");
      }
    }
  }, []);

  const handleProfileDialogOpenChange = useCallback((open: boolean) => {
    setIsProfileOpen(open);
    if (!open) {
      setProfileState("idle");
      setSelectedProfile(null);
      setProfileErrorMessage(null);
    }
  }, []);

  const handleRefresh = () => {
    setActionError(null);
    return refetch();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 md:space-y-8">
      <div className="flex flex-col gap-3">
        <div className="rounded-[32px] border border-orange-100 bg-gradient-to-r from-white via-orange-50 to-white p-6 shadow-lg shadow-orange-200/40">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Heart className="h-7 w-7 text-red-500" />
              <h1 className="text-2xl font-semibold text-slate-900">
                自分がご飯に誘われて良い人へいいねを送ろう！
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="min-w-[96px]"
          >
            {isPending ? "更新中..." : "更新"}
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
          <p className="text-sm text-slate-500">
            まだ表示できるメンバーがいません。
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              isAdmin={isAdmin}
              onToggleLike={handleToggleLike}
              onDeleteUser={
                isAdmin ? () => handleDeleteUser(member.id) : undefined
              }
              isUpdating={updatingState?.memberId === member.id}
              onViewProfile={handleOpenProfile}
            />
          ))}
        </div>
      )}
      <Dialog open={isProfileOpen} onOpenChange={handleProfileDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>プロフィール</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              他のメンバーのプロフィールを閲覧できます。
            </DialogDescription>
          </DialogHeader>

          {profileState === "loading" && (
            <div className="flex flex-col items-center justify-center gap-2 py-6">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
              <p className="text-sm text-slate-600">読み込み中...</p>
            </div>
          )}

          {(profileState === "notFound" || profileState === "error") && (
            <div className="py-6 text-sm text-slate-600">
              {profileErrorMessage ??
                "プロフィールの取得に失敗しました。"}
            </div>
          )}

          {profileState === "loaded" && selectedProfile && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  imageUrl={selectedProfile.profileImageUrl ?? undefined}
                  name={selectedProfile.name}
                  size="md"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-base font-semibold text-slate-900">
                    {selectedProfile.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    プロフィール完成度 {selectedProfile.completionRate}%
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-800">エリア</p>
                <p className="text-slate-600">
                  {selectedProfile.mainArea ?? "エリア未設定"}
                </p>
                {selectedProfile.subAreas.length > 0 && (
                  <p className="text-xs text-slate-500">
                    サブエリア: {selectedProfile.subAreas.join(" / ")}
                  </p>
                )}
                {selectedProfile.areas.length > 0 && (
                  <p className="text-xs text-slate-500">
                    エリア全体: {selectedProfile.areas.join(" / ")}
                  </p>
                )}
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold text-slate-800">飲み方</p>
                  <p className="text-slate-600">
                    {drinkingStyleLabel ?? "未設定"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">GO飯スタイル</p>
                  <p className="text-slate-600">
                    {mealStyleLabel ?? "未設定"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">頻度</p>
                  <p className="text-slate-600">
                    {frequencyLabel ?? "未設定"}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <p className="font-semibold text-slate-800">好きなご飯</p>
                <FavoriteMealsList
                  meals={selectedProfile.favoriteMeals}
                  placeholder="好きなご飯: 未設定"
                  variant="plain"
                  className="text-slate-600"
                />
              </div>

              {selectedProfile.hobbies.length > 0 && (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-800">趣味</p>
                  <p className="text-slate-600">
                    {selectedProfile.hobbies.join(" / ")}
                  </p>
                </div>
              )}

              {selectedProfile.bio && (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-slate-800">ひとこと</p>
                  <p className="whitespace-pre-line text-slate-700">
                    {selectedProfile.bio}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

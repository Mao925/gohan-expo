"use client";

import { useEffect, useState } from "react";
import { Loader2, Heart } from "lucide-react";
import { CommunityGate } from "@/components/community/community-gate";
import { ErrorBanner } from "@/components/error-banner";
import { MemberCard } from "@/components/member-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  deleteMember,
  fetchMembers,
  LikeAnswer,
  updateLikeStatus,
} from "@/lib/api";
import { LikeStatus, Member } from "@/lib/types";

type UpdatingState = { memberId: string } | null;

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
  const handleToggleLike = async (
    memberId: string,
    currentStatus: LikeStatus
  ) => {
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
      setActionError(
        "いいねの送信に失敗しました。通信環境を確認して再度お試しください。"
      );
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
                を押した人とのご飯会に誘われることが多くなるよ！
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

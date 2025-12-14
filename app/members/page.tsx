"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Heart, Info, Loader2 } from "lucide-react";
import { CommunityGate } from "@/components/community/community-gate";
import { ErrorBanner } from "@/components/error-banner";
import { MemberCard } from "@/components/member-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCommunitySelfStatus } from "@/hooks/use-community-self-status";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import {
  ApiError,
  deleteMember,
  fetchMembers,
  fetchMyReactionCounts,
  LikeAnswer,
  updateLikeStatus,
  createSuperLike,
  deleteSuperLike,
} from "@/lib/api";
import { Member } from "@/lib/types";
import {
  ReactionIcon,
  type ReactionType,
} from "@/components/reactions/reaction-icon";

type ReactionStatProps = {
  type: ReactionType;
  count: string | number;
};

function ReactionStat({ type, count }: ReactionStatProps) {
  const containerClasses =
    type === "heart"
      ? "border border-red-200 bg-red-50 text-red-600 shadow-sm shadow-red-200/70"
      : "border border-yellow-200 bg-yellow-50 text-yellow-500 shadow-sm shadow-yellow-200/70";

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${containerClasses}`}
      >
        <ReactionIcon type={type} filled />
      </div>
      <span className="text-2xl font-semibold text-slate-900">{count}</span>
    </div>
  );
}

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
  const { data: communityStatus } = useCommunitySelfStatus(Boolean(user));
  const communityId = communityStatus?.community?.id;
  const { data: reactionCounts } = useQuery({
    queryKey: ["reaction-counts", communityId],
    queryFn: () => fetchMyReactionCounts(communityId!),
    enabled: Boolean(communityId),
  });
  const [members, setMembers] = useState<Member[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingState, setUpdatingState] = useState<UpdatingState>(null);
  const [superLikeLoadingMemberId, setSuperLikeLoadingMemberId] = useState<
    string | null
  >(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { toast } = useToast();
  const infoWrapperRef = useRef<HTMLDivElement | null>(null);
  const infoId = useId();
  const popoverId = `${infoId}-reaction-info`;
  const triggerId = `${infoId}-reaction-info-trigger`;

  useEffect(() => {
    setMembers(data ?? []);
  }, [data]);

  useEffect(() => {
    if (!isInfoOpen) return;

    const handleOutsideOpen = (event: MouseEvent | TouchEvent) => {
      if (
        infoWrapperRef.current &&
        event.target instanceof Node &&
        infoWrapperRef.current.contains(event.target)
      ) {
        return;
      }

      setIsInfoOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideOpen);
    document.addEventListener("touchstart", handleOutsideOpen);
    document.addEventListener("keyup", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideOpen);
      document.removeEventListener("touchstart", handleOutsideOpen);
      document.removeEventListener("keyup", handleEscape);
    };
  }, [isInfoOpen]);

  const handleInfoOpen = () => setIsInfoOpen(true);
  const handleInfoClose = () => setIsInfoOpen(false);
  const handleInfoToggle = () => setIsInfoOpen((prev) => !prev);

  const isInitialLoading = isPending && members.length === 0;
  const formatReactionCount = (value: number | null | undefined) =>
    value === undefined || value === null ? "-" : value;

  const heartsDisplay = formatReactionCount(reactionCounts?.received?.hearts);
  const starsDisplay = formatReactionCount(reactionCounts?.received?.stars);
  const apiErrorMessage = (error as ApiError | undefined)?.message ?? null;
  const friendlyApiError =
    apiErrorMessage === "Missing Authorization header"
      ? "ログインし直してください"
      : apiErrorMessage;
  const errorMessage = actionError ?? friendlyApiError;
  const handleToggleLike = async (memberId: string) => {
    if (updatingState?.memberId === memberId) return;
    const targetMember = members.find((item) => item.id === memberId);
    if (!targetMember) return;

    const nextAnswer: LikeAnswer = targetMember.likedByMe ? "NO" : "YES";

    setActionError(null);
    setUpdatingState({ memberId });

    try {
      await updateLikeStatus(memberId, nextAnswer);
      await refetch();
    } catch (err: any) {
      console.error("Failed to update like status", err);
      setActionError(
        "いいねの送信に失敗しました。通信環境を確認して再度お試しください。"
      );
    } finally {
      setUpdatingState(null);
    }
  };

  const handleToggleSuperLike = async (memberId: string) => {
    if (superLikeLoadingMemberId === memberId) return;
    const targetMember = members.find((item) => item.id === memberId);
    if (!targetMember) return;
    const isCurrentlySuperLiked = targetMember.superLikedByMe;

    setActionError(null);
    setSuperLikeLoadingMemberId(memberId);

    try {
      if (isCurrentlySuperLiked) {
        await deleteSuperLike(memberId);
      } else {
        const result = await createSuperLike(memberId);
        if (result.matched) {
          toast({
            title: result.partnerName
              ? `${result.partnerName}さんとマッチしました！`
              : "マッチが成立しました！",
            description: result.partnerFavoriteMeals?.length
              ? `好きなご飯: ${result.partnerFavoriteMeals.join("・")}`
              : undefined,
          });
        }
      }

      await refetch();
    } catch (err: any) {
      console.error("Failed to toggle super like", err);
      setActionError(
        "スーパーいいねの送信に失敗しました。通信環境を確認して再度お試しください。"
      );
    } finally {
      setSuperLikeLoadingMemberId(null);
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

      <div className="space-y-3 rounded-[32px] border border-slate-200 bg-white/80 px-6 py-5 text-center shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-center text-sm text-slate-500">
          <p className="text-sm text-slate-500">あなたとご飯に行きたい人の数</p>
          <div
            ref={infoWrapperRef}
            className="relative inline-flex ml-1"
            onMouseEnter={handleInfoOpen}
            onMouseLeave={handleInfoClose}
          >
            <button
              id={triggerId}
              type="button"
              aria-label="♡/☆の説明"
              aria-expanded={isInfoOpen}
              aria-controls={popoverId}
              className="rounded-full p-1 text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              onFocus={handleInfoOpen}
              onBlur={handleInfoClose}
              onClick={handleInfoToggle}
            >
              <Info className="h-4 w-4" />
            </button>
            {isInfoOpen && (
              <div
                id={popoverId}
                role="tooltip"
                aria-labelledby={triggerId}
                className="absolute right-0 top-full z-50 mt-2 w-[260px] max-w-[260px] rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg shadow-slate-300/60"
              >
                <div className="space-y-2 leading-relaxed text-left">
                  <p>
                    ♡：ご飯に行きたい人に押す<br></br>
                    （例：あまり話したことのない人）
                  </p>
                  <p>
                    ☆：絶対にご飯に居て欲しい人に押す<br></br>
                    （例：この人がいれば安心な人）
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-8">
          <ReactionStat type="heart" count={heartsDisplay} />
          <ReactionStat type="star" count={starsDisplay} />
        </div>
      </div>

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
          {members.map((member) => {
            const reactionLink =
              communityId && isAdmin
                ? `/communities/${communityId}/admin/members/${member.id}/reactions`
                : undefined;

            return (
              <MemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                onLike={handleToggleLike}
                onSuperLike={handleToggleSuperLike}
                isSuperLikeLoading={superLikeLoadingMemberId === member.id}
                onDeleteUser={
                  isAdmin ? () => handleDeleteUser(member.id) : undefined
                }
                isUpdating={updatingState?.memberId === member.id}
                showMatchBadge={false}
                reactionLink={reactionLink}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CommunityGate } from "@/components/community/community-gate";
import { FavoriteMealsList } from "@/components/favorite-meals-list";
import { ErrorBanner } from "@/components/error-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useAuth } from "@/context/auth-context";
import { ApiError, apiFetch } from "@/lib/api";
import { DEV_RESET_LIKE_ENDPOINT, triggerDevResetLikes } from "@/lib/dev-tools";
import { LikeCandidate } from "@/lib/types";

export default function LikePage() {
  return (
    <CommunityGate>
      <LikeContent />
    </CommunityGate>
  );
}

function LikeContent() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [isResettingLikes, setIsResettingLikes] = useState(false);

  type NextCandidateResponse = { candidate: LikeCandidate | null };

  const { data: candidateResponse, isPending } = useQuery<NextCandidateResponse>({
    queryKey: ["like-candidate", token, refreshIndex],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch<NextCandidateResponse>("/api/like/next-candidate", { token });
      } catch (err: any) {
        setError(err?.message ?? "候補の取得に失敗しました");
        throw err;
      }
    },
    enabled: Boolean(token),
    staleTime: 0,
  });

  const candidate = candidateResponse?.candidate ?? null;

  const { mutate: mutateLike, isPending: likePending } = useMutation({
    mutationFn: ({
      answer,
      targetUserId,
    }: {
      answer: "YES" | "NO";
      targetUserId: string;
    }) =>
      apiFetch<{ matched?: boolean; partnerName?: string }>("/api/like", {
        method: "POST",
        data: { targetUserId, answer },
        token,
      }),
    onSuccess: (data) => {
      setError(null);
      setMatchMessage(null);
      if (data?.matched) {
        setMatchMessage(
          data.partnerName
            ? `${data.partnerName}さんとマッチしました！`
            : "マッチが成立しました！"
        );
        queryClient.invalidateQueries({ queryKey: ["matches", token] });
      }
      setRefreshIndex((prev) => prev + 1);
    },
    onError: (err: any) => {
      const apiError = err as ApiError | undefined;
      setError(apiError?.message ?? "送信に失敗しました");
    },
  });

  // リセット用エンドポイントが設定されていれば本番でも有効にする
  const canResetLikes = Boolean(DEV_RESET_LIKE_ENDPOINT);

  const handleAnswer = (answer: "YES" | "NO") => {
    if (!candidate) return;
    mutateLike({ answer, targetUserId: candidate.id });
  };

  const handleRefreshCandidate = async () => {
    if (canResetLikes && token) {
      setIsResettingLikes(true);
      setError(null);
      try {
        await triggerDevResetLikes(token);
        setMatchMessage(
          "選択状況をリセットしました。もう一度 YES / NO を選んでみましょう。"
        );
      } catch (err: any) {
        setError(err?.message ?? "履歴のリセットに失敗しました");
      } finally {
        setIsResettingLikes(false);
      }
    }
    setRefreshIndex((prev) => prev + 1);
  };

  return (
    <div className="mx-auto max-w-4xl md:max-w-5xl space-y-6 md:space-y-8">
      <ErrorBanner message={matchMessage ?? error} />
      {isPending ? (
        <Card className="p-5 md:p-6">
          <p className="text-slate-500">読み込み中...</p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefreshCandidate}
            disabled={isResettingLikes}
          >
            {isResettingLikes ? "リセット中..." : "選択を更新"}
          </Button>
        </Card>
      ) : candidate ? (
        <Card className="space-y-6 p-5 md:p-7">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-sm uppercase tracking-[0.5em] text-slate-400">
              M E M B E R
            </p>
            <ProfileAvatar
              imageUrl={candidate.profileImageUrl}
              name={candidate.name}
              size="lg"
              className="mx-auto"
            />
            <h2 className="text-3xl font-semibold text-slate-900">
              {candidate.name}
            </h2>
          </div>
          <div className="space-y-3 text-left">
            <p className="text-sm font-semibold text-slate-700">好きなご飯</p>
            <FavoriteMealsList meals={candidate.favoriteMeals} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full bg-red-500/10 text-red-600"
              disabled={likePending}
              onClick={() => handleAnswer("NO")}
            >
              NO / 今回はパス
            </Button>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={likePending}
              onClick={() => handleAnswer("YES")}
            >
              YES / 行きたい！
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="space-y-3 p-5 md:p-6">
          <p className="text-slate-500">
            今は表示できるメンバーがいません。シードデータが投入済みか確認し、必要なら管理者に連絡してください。
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefreshCandidate}
            disabled={isResettingLikes}
          >
            {isResettingLikes ? "リセット中..." : "選択を更新"}
          </Button>
          <div className="text-xs text-slate-500">
            <p>コミュニティへ参加済みのメンバーが増えると、自動で候補が表示されます。</p>
            <p className="mt-1">
              管理者の承認後に利用できるようになります。まだ未承認の場合は承認をお待ちください。
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/error-banner";
import { Input } from "@/components/ui/input";
import { apiFetch, ApiError } from "@/lib/api";
import { MatchCandidate } from "@/lib/types";
import { useAuth } from "@/context/auth-context";
import { useCommunityStatus } from "@/hooks/use-community-status";
import { DEV_RESET_LIKE_ENDPOINT, triggerDevResetLikes } from "@/lib/dev-tools";

const STORAGE_KEY = "gohan_last_community_code";

export default function LikePage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [inlineCode, setInlineCode] = useState("");
  const [isResettingLikes, setIsResettingLikes] = useState(false);
  const {
    data: statusData,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus,
  } = useCommunityStatus({ refetchInterval: 15000 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLastCode(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const isApproved = statusData?.status === "APPROVED";
  const statusErrorMessage =
    (statusError as ApiError | undefined)?.message ?? null;

  type NextCandidateResponse = { candidate: MatchCandidate | null };

  const { data: candidateResponse, isPending } =
    useQuery<NextCandidateResponse>({
      queryKey: ["like-candidate", token, refreshIndex],
      queryFn: async () => {
        try {
          setError(null);
          return await apiFetch<NextCandidateResponse>(
            "/api/like/next-candidate",
            { token }
          );
        } catch (err: any) {
          setError(err?.message ?? "候補の取得に失敗しました");
          throw err;
        }
      },
      enabled: Boolean(token && isApproved),
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
      if (apiError?.message) {
        setError(apiError.message);
      } else if (apiError?.status === 400) {
        setError(
          "コミュニティ参加が完了していません。再申請してからご利用ください。"
        );
      } else {
        setError("送信に失敗しました");
      }
    },
  });

  const { mutate: mutateRetryJoin, isPending: retryJoinPending } = useMutation({
    mutationFn: async (payload?: { code?: string }) => {
      if (!token) throw new Error("ログインしてください");
      const code = payload?.code ?? lastCode;
      if (!code) throw new Error("コミュニティコードを入力してください。");
      return apiFetch("/api/community/join", {
        method: "POST",
        data: { communityCode: code },
        token,
      });
    },
    onSuccess: async (_data, variables) => {
      setError(null);
      const code = variables?.code ?? lastCode;
      if (code && typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, code);
        setLastCode(code);
      }
      await refetchStatus();
    },
    onError: (err: any) => setError(err?.message ?? "再申請に失敗しました"),
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">ログインするとメンバーが表示されます。</p>
      </Card>
    );
  }

  const handleAnswer = (answer: "YES" | "NO") => {
    if (!candidate) return;
    mutateLike({ answer, targetUserId: candidate.id });
  };

  const handleRetryJoin = (code?: string) => {
    mutateRetryJoin(code ? { code } : undefined);
  };

  const canResetLikes =
    process.env.NODE_ENV !== "production" && Boolean(DEV_RESET_LIKE_ENDPOINT);

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

  const statusValue = statusData?.status ?? "UNAPPLIED";
  const autoJoinAttempted = useRef(false);

  useEffect(() => {
    if (
      statusValue === "UNAPPLIED" &&
      lastCode &&
      token &&
      !retryJoinPending &&
      !autoJoinAttempted.current
    ) {
      autoJoinAttempted.current = true;
      mutateRetryJoin();
    }
    if (statusValue !== "UNAPPLIED") {
      autoJoinAttempted.current = false;
    }
  }, [statusValue, lastCode, token, retryJoinPending, mutateRetryJoin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">
          ご飯に行きたい？
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          一度選んだらやり直しはできません。直感で選んでみましょう。
        </p>
      </div>
      <ErrorBanner message={matchMessage ?? error ?? statusErrorMessage} />
      {statusLoading ? (
        <Card>
          <p className="text-slate-500">ステータス確認中...</p>
        </Card>
      ) : !isApproved ? (
        <Card className="space-y-4">
          {statusValue === "UNAPPLIED" ? (
            <>
              <p className="text-slate-700">
                まだコミュニティへの参加申請が完了していません。まずはコードを入力して参加申請を行ってください。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href="/community/join">コミュニティ申請画面へ</Link>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!lastCode || retryJoinPending}
                  onClick={() => handleRetryJoin()}
                >
                  {retryJoinPending
                    ? "再申請中..."
                    : lastCode
                    ? "前回のコードで再申請"
                    : "コード未保存"}
                </Button>
              </div>
              {!lastCode ? (
                <div className="space-y-2 rounded-2xl border border-orange-100 bg-orange-50 p-4 text-sm text-slate-600">
                  <p className="font-medium text-slate-800">
                    コードがまだ保存されていません
                  </p>
                  <p>その場で入力して申請することもできます。</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      placeholder="ABCD1234"
                      maxLength={8}
                      value={inlineCode}
                      onChange={(e) =>
                        setInlineCode(e.target.value.toUpperCase())
                      }
                    />
                    <Button
                      type="button"
                      disabled={retryJoinPending || inlineCode.length !== 8}
                      onClick={() => handleRetryJoin(inlineCode)}
                    >
                      {retryJoinPending ? "申請中..." : "このコードで申請"}
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-slate-600">
              コミュニティ承認待ちです。管理者が承認すると自動で操作できるようになります。（直近のステータス:{" "}
              {statusData?.status ?? "未確認"}）
            </p>
          )}
        </Card>
      ) : isPending ? (
        <Card className="space-y-3">
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
        <div className="flex flex-col gap-6">
          <Card className="text-center">
            <p className="text-sm uppercase tracking-[0.5em] text-slate-400">
              M E M B E R
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">
              {candidate.name}
            </h2>
            <p className="mt-4 text-base text-slate-600">{candidate.bio}</p>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full bg-red-500/10 text-red-600"
              disabled={likePending || !isApproved}
              onClick={() => handleAnswer("NO")}
            >
              NO / 今回はパス
            </Button>
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={likePending || !isApproved}
              onClick={() => handleAnswer("YES")}
            >
              YES / 行きたい！
            </Button>
          </div>
        </div>
      ) : (
        <Card className="space-y-3">
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
        </Card>
      )}
    </div>
  );
}

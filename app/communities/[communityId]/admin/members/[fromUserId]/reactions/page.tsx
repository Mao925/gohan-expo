"use client";

import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ErrorBanner } from "@/components/error-banner";
import { useAuth } from "@/context/auth-context";
import {
  ApiError,
  AdminUserHeartsResponse,
  AdminUserStarsResponse,
  fetchAdminUserHearts,
  fetchAdminUserStars,
} from "@/lib/api";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const getSectionErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "権限がありません（adminのみ）";
    }
    if (error.status === 404) {
      return "ユーザー/コミュニティが見つかりません";
    }
  }

  return "読み込みに失敗しました";
};

export default function MemberReactionsPage() {
  const params = useParams();
  const communityParam = params?.communityId;
  const fromUserParam = params?.fromUserId;
  const communityId = Array.isArray(communityParam) ? communityParam[0] : communityParam;
  const fromUserId = Array.isArray(fromUserParam) ? fromUserParam[0] : fromUserParam;
  const { user } = useAuth();
  const isAdmin = Boolean(user?.isAdmin);
  const queryEnabled = Boolean(communityId && fromUserId && isAdmin);

  const heartsQuery = useQuery<AdminUserHeartsResponse>({
    queryKey: ["admin-member-hearts", communityId, fromUserId],
    queryFn: () => fetchAdminUserHearts(communityId!, fromUserId!),
    enabled: queryEnabled,
  });

  const starsQuery = useQuery<AdminUserStarsResponse>({
    queryKey: ["admin-member-stars", communityId, fromUserId],
    queryFn: () => fetchAdminUserStars(communityId!, fromUserId!),
    enabled: queryEnabled,
  });

  const hearts = heartsQuery.data?.hearts ?? [];
  const stars = starsQuery.data?.stars ?? [];
  const fromUserName =
    heartsQuery.data?.fromUser.name ?? starsQuery.data?.fromUser.name ?? "";

  if (!communityId || !fromUserId) {
    return (
      <Card>
        <p className="text-slate-700">無効なパラメータです。</p>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <p className="text-slate-700">権限がありません。</p>
      </Card>
    );
  }

  const pageTitle = fromUserName ? `${fromUserName} のリアクション一覧` : "リアクション一覧";
  const showGlobalError = heartsQuery.isError && starsQuery.isError;
  const heartsErrorMessage = heartsQuery.error ? getSectionErrorMessage(heartsQuery.error) : null;
  const starsErrorMessage = starsQuery.error ? getSectionErrorMessage(starsQuery.error) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{pageTitle}</h1>
        <p className="text-sm text-slate-500">押したハート / スターの一覧を確認できます。</p>
      </div>
      {showGlobalError && <ErrorBanner message="読み込みに失敗しました" />}
      <Card className="space-y-6 p-5">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">ハート（Like）</h2>
          {heartsQuery.isLoading && !heartsQuery.data ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <p>読み込み中...</p>
            </div>
          ) : heartsErrorMessage ? (
            <p className="text-sm font-medium text-rose-600">{heartsErrorMessage}</p>
          ) : hearts.length === 0 ? (
            <p className="text-sm text-slate-500">ハートはまだありません</p>
          ) : (
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ユーザー</th>
                    <th className="px-4 py-3">日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {hearts.map((entry) => (
                    <tr key={`${entry.toUser.id}-${entry.createdAt}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{entry.toUser.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">スター（SuperLike）</h2>
          {starsQuery.isLoading && !starsQuery.data ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
              <p>読み込み中...</p>
            </div>
          ) : starsErrorMessage ? (
            <p className="text-sm font-medium text-rose-600">{starsErrorMessage}</p>
          ) : stars.length === 0 ? (
            <p className="text-sm text-slate-500">スターはまだありません</p>
          ) : (
            <div className="overflow-hidden rounded border border-slate-200">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">ユーザー</th>
                    <th className="px-4 py-3">日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {stars.map((entry) => (
                    <tr key={`${entry.toUser.id}-${entry.createdAt}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{entry.toUser.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{formatDate(entry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Card>
    </div>
  );
}

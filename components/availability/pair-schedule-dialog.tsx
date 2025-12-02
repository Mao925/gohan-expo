"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/error-banner";
import { useAuth } from "@/context/auth-context";
import { apiFetch } from "@/lib/api";
import {
  fetchPairAvailability,
  PairAvailabilitySlotDto,
} from "@/lib/api/availability";
import { MemberRelationship, Profile } from "@/lib/types";
import { PairScheduleContent } from "@/components/availability/pair-schedule-content";

type PairScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: MemberRelationship | null;
};

export function PairScheduleDialog({
  open,
  onOpenChange,
  partner,
}: PairScheduleDialogProps) {
  const { token, user } = useAuth();
  const partnerUserId = partner?.targetUserId ?? partner?.id ?? null;

  useEffect(() => {
    if (typeof document === "undefined") return;
    const cls = "hide-app-chrome";
    const body = document.body;
    if (open) {
      body.classList.add(cls);
    } else {
      body.classList.remove(cls);
    }
    return () => body.classList.remove(cls);
  }, [open]);

  const { data: profileData } = useQuery<Profile>({
    queryKey: ["profile", token],
    queryFn: () => {
      if (!token) throw new Error("ログインしてください");
      return apiFetch<Profile>("/api/profile", { token });
    },
    enabled: open && Boolean(token),
  });

  const {
    data: pairData,
    isPending,
    error,
  } = useQuery<{ slots: PairAvailabilitySlotDto[] }>({
    queryKey: ["pair-availability", partnerUserId, token],
    queryFn: async () => {
      if (!partnerUserId) throw new Error("表示するお相手が見つかりません");
      return fetchPairAvailability(partnerUserId, token ?? undefined);
    },
    enabled: open && Boolean(partnerUserId && token),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl space-y-6">
        <div className="space-y-1">
          <DialogTitle className="text-xl font-semibold text-[var(--text-strong)]">
            {partner ? `${partner.name}さんとの日程` : "日程"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-muted)]">
            今週の GO / STAY を確認できます。
          </DialogDescription>
        </div>

        {isPending ? (
          <p className="py-10 text-center text-slate-500">読み込み中...</p>
        ) : error ? (
          <ErrorBanner
            message={(error as Error)?.message ?? "取得に失敗しました"}
          />
        ) : !pairData ? (
          <p className="py-10 text-center text-slate-500">
            データがありません。
          </p>
        ) : (
          <>
            <PairScheduleContent
              pairAvailabilitySlots={pairData.slots}
              userName={user?.name}
              userFavoriteMeals={profileData?.favoriteMeals}
              partnerName={partner?.name}
              partnerFavoriteMeals={partner?.favoriteMeals}
            />
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                閉じる
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

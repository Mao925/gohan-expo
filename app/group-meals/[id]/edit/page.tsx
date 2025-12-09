"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/auth-context";
import { useGroupMealDetail, useUpdateGroupMealMetadata } from "@/hooks/use-group-meals";
import { isForbiddenError } from "@/lib/api";
import type { ApiError } from "@/lib/api";
import {
  GroupMealMetadataForm,
  type GroupMealMetadataFormValues,
} from "@/components/group-meals/group-meal-metadata-form";
import { canManageGroupMealFrontend, GROUP_MEAL_MANAGE_FORBIDDEN_MESSAGE } from "@/features/groupMeals/permissions";

export default function GroupMealMetadataEditPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: groupMeal, isPending, error } = useGroupMealDetail(params.id);
  const updateMutation = useUpdateGroupMealMetadata(params.id);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const schedule = useMemo(() => {
    if (!groupMeal) return null;
    const defaultTimeBand = groupMeal.timeSlot === "DAY" ? "LUNCH" : "DINNER";
    return (
      groupMeal.schedule ?? {
        date: groupMeal.date,
        timeBand: defaultTimeBand,
        meetingTime: null,
        meetingTimeMinutes: null,
        place: null,
      }
    );
  }, [groupMeal]);

  const metadataInitialValues = useMemo(() => {
    if (!groupMeal || !schedule) return null;
    return {
      title: groupMeal.title ?? "",
      date: schedule.date ?? groupMeal.date,
      timeSlot: groupMeal.timeSlot,
      gatherTime: schedule.meetingTime ?? "",
      capacity: groupMeal.capacity,
      nearestStation: groupMeal.nearestStation ?? "",
      budget: groupMeal.budget ?? "",
    } as GroupMealMetadataFormValues;
  }, [groupMeal, schedule]);

  const from = searchParams.get("from") ?? `/group-meals/${params.id}`;
  const canEdit = Boolean(groupMeal && canManageGroupMealFrontend(user, groupMeal));

  const handleCancel = () => {
    router.push(from);
  };

  const handleAutoSave = useCallback(
    (values: GroupMealMetadataFormValues) => {
      setFormError(null);
      updateMutation.mutate(
        {
          title: values.title.trim() || null,
          date: values.date,
          timeSlot: values.timeSlot,
          gatherTime: values.gatherTime || null,
          capacity: values.capacity,
          nearestStation: values.nearestStation.trim() || null,
          budget: values.budget || null,
        },
        {
          onError: (error) => {
            if (isForbiddenError(error)) {
              toast({
                title: "操作できません",
                description: GROUP_MEAL_MANAGE_FORBIDDEN_MESSAGE,
              });
              setFormError(GROUP_MEAL_MANAGE_FORBIDDEN_MESSAGE);
              return;
            }
            const apiError = error as ApiError;
            if (apiError.status === 401) {
              setFormError("認証が必要です。再ログインしてください");
              return;
            }
            if (apiError.status === 404) {
              router.replace("/group-meals");
              return;
            }
            setFormError(apiError.message ?? "箱の情報の更新に失敗しました");
          }
        }
      );
    },
    [router, updateMutation, toast]
  );

  if (isPending) {
    return (
      <Card className="mx-auto mt-24 w-full max-w-3xl text-center">
        <p className="text-sm text-slate-600">読み込み中...</p>
      </Card>
    );
  }

  if (error && !groupMeal) {
    return (
      <Card className="mx-auto mt-12 max-w-3xl space-y-3 text-center">
        <p className="text-sm text-slate-700">{(error as ApiError).message ?? "読み込みに失敗しました"}</p>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/group-meals">一覧に戻る</Link>
        </Button>
      </Card>
    );
  }

  if (!groupMeal || !metadataInitialValues) {
    return (
      <Card className="mx-auto mt-12 max-w-3xl space-y-3 text-center">
        <p className="text-sm text-slate-700">編集対象の箱が見つかりませんでした。</p>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          詳細に戻る
        </Button>
      </Card>
    );
  }

  if (!canEdit) {
    return (
      <Card className="mx-auto mt-12 max-w-3xl space-y-3 text-center">
        <p className="text-sm text-slate-700">この箱を編集する権限がありません。</p>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          戻る
        </Button>
      </Card>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Group Meal</p>
          <h1 className="text-2xl font-semibold text-slate-900">箱の情報を編集</h1>
        </div>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          戻る
        </Button>
      </div>

      <Card className="space-y-6">
        <p className="text-sm text-slate-600">タイトル・日時・時間帯・定員・集合場所・予算を更新できます。</p>
        <GroupMealMetadataForm
          initialValues={metadataInitialValues}
          onSubmit={handleAutoSave}
          onChange={handleAutoSave}
          showActions={false}
          autoSaveDelay={600}
          submitting={updateMutation.isPending}
          error={formError}
        />
      </Card>
    </main>
  );
}

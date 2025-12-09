"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { CommunityGate } from "@/components/community/community-gate";
import { ErrorBanner } from "@/components/error-banner";
import { useAuth } from "@/context/auth-context";
import {
  createGroupMeal,
  type CreateGroupMealPayload,
  type GroupMealBudget,
  type GroupMealMode,
  type ScheduleTimeBand,
} from "@/lib/api";

const createTimeOptions = (
  startMinutes: number,
  endMinutes: number
): string[] => {
  const options: string[] = [];
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    options.push(
      `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`
    );
  }
  return options;
};

const TIME_OPTIONS: Record<ScheduleTimeBand, string[]> = {
  LUNCH: createTimeOptions(10 * 60, 15 * 60),
  DINNER: createTimeOptions(18 * 60, 23 * 60),
};

const getDefaultMeetingTime = (band: ScheduleTimeBand): string =>
  TIME_OPTIONS[band][0] ?? "";

export default function NewGroupMealPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [mode, setMode] = useState<GroupMealMode>("REAL");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [timeBand, setTimeBand] = useState<ScheduleTimeBand>("LUNCH");
  const [meetingTime, setMeetingTime] = useState<string>(
    getDefaultMeetingTime("LUNCH")
  );
  const [capacity, setCapacity] = useState<number>(4);
  const [nearestStation, setNearestStation] = useState("");
  const [budget, setBudget] = useState<GroupMealBudget | "">("");
  const [meetUrl, setMeetUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!date) {
      setFormError("日付を入力してください");
      return;
    }
    if (!meetingTime) {
      setFormError("集合時間を入力してください");
      return;
    }
    if (capacity < 2) {
      setFormError("定員を選択してください");
      return;
    }
    if (mode === "MEET" && !meetUrl.trim()) {
      setFormError("Meetリンクを入力してください");
      return;
    }
    if (!token) {
      setFormError("認証情報がありません。再ログインしてください");
      return;
    }

    setSubmitting(true);
    try {
      const schedule: CreateGroupMealPayload["schedule"] = {
        date,
        timeBand,
        meetingTime,
      };

      if (mode === "REAL" && nearestStation.trim().length > 0) {
        schedule.place = {
          name: nearestStation.trim(),
        };
      }

      const payload: CreateGroupMealPayload = {
        title: title.trim() || undefined,
        capacity,
        budget: mode === "REAL" && budget ? budget : null,
        schedule,
        mode,
        ...(mode === "MEET" && meetUrl.trim()
          ? { meetUrl: meetUrl.trim() }
          : {}),
      };

      const created = await createGroupMeal(token, payload);
      router.push(`/group-meals?mode=${created.mode.toLowerCase()}`);
    } catch (error: any) {
      const message = error?.message ?? "箱の作成に失敗しました";
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommunityGate>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">新しい箱を作る</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            リアル / Meet のどちらの GO飯
            も作成できます。モードに応じた入力項目を使い分けてください。
          </p>
        </div>
        <Button size="sm" variant="secondary" asChild>
          <Link href="/group-meals" className="text-sm">
            一覧に戻る
          </Link>
        </Button>
      </header>

      <section className="rounded-2xl border bg-background p-4 shadow-sm md:p-6">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                mode === "REAL"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => setMode("REAL")}
            >
              リアルでGO飯
            </button>
            <button
              type="button"
              className={`px-4 py-2 rounded-full text-sm font-medium border ${
                mode === "MEET"
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-700"
              }`}
              onClick={() => setMode("MEET")}
            >
              MeetでGO飯
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                タイトル（任意）
              </label>
              <input
                type="text"
                className="w-full border rounded-md px-3 py-2 text-sm"
                placeholder={
                  mode === "REAL"
                    ? "例: 今日のリアルGO飯（昼）"
                    : "例: 今日のMeetでGO飯"
                }
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">日付</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">時間帯</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={timeBand}
                onChange={(event) => {
                  const nextTimeBand = event.target.value as ScheduleTimeBand;
                  setTimeBand(nextTimeBand);
                  setMeetingTime(getDefaultMeetingTime(nextTimeBand));
                }}
              >
                <option value="LUNCH">昼ごはん（LUNCH）</option>
                <option value="DINNER">夜ごはん（DINNER）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">集合時間</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={meetingTime}
                onChange={(event) => setMeetingTime(event.target.value)}
              >
                {TIME_OPTIONS[timeBand].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {timeBand === "LUNCH"
                  ? "10:00〜15:00 の範囲を 30 分刻みで選択できます（サーバー側でもバリデーションされます）"
                  : "18:00〜23:00 の範囲を 30 分刻みで選択できます（サーバー側でもバリデーションされます）"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                定員（2〜6人推奨）
              </label>
              <input
                type="number"
                min={2}
                max={10}
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={capacity}
                onChange={(event) =>
                  setCapacity(Number(event.target.value) || 0)
                }
              />
            </div>
          </div>

          {mode === "REAL" && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  集合場所の最寄駅
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="例: 新宿駅"
                  value={nearestStation}
                  onChange={(event) => setNearestStation(event.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  飲食店名ではなく、「集合する駅名」を入力してください。
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  予算の目安
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={budget}
                  onChange={(event) =>
                    setBudget(event.target.value as GroupMealBudget | "")
                  }
                >
                  <option value="">未設定</option>
                  <option value="UNDER_1000">〜1,000円</option>
                  <option value="UNDER_1500">〜1,500円</option>
                  <option value="UNDER_2000">〜2,000円</option>
                  <option value="OVER_2000">2,000円以上</option>
                </select>
              </div>
            </div>
          )}

          {mode === "MEET" && (
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Meetリンク
                </label>
                <input
                  type="url"
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  value={meetUrl}
                  onChange={(event) => setMeetUrl(event.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Google Meet の URL を入力してください。MEET
                  モードでは必須です。
                </p>
              </div>
            </div>
          )}

          <ErrorBanner message={formError} />

          <div className="mt-4 flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "作成中…" : "箱を作成する"}
            </Button>
          </div>
        </form>
      </section>
      </main>
    </CommunityGate>
  );
}

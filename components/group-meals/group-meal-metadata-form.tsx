"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/error-banner";
import { formatBudgetLabel, GroupMealBudget, TimeSlot } from "@/lib/api";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

const createTimeOptions = (startMinutes: number, endMinutes: number): string[] => {
  const options: string[] = [];
  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    options.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`);
  }
  return options;
};

const TIME_OPTIONS: Record<TimeSlot, string[]> = {
  DAY: createTimeOptions(10 * 60, 15 * 60),
  NIGHT: createTimeOptions(18 * 60, 23 * 60),
};

export type GroupMealMetadataFormValues = {
  title: string;
  date: string;
  timeSlot: TimeSlot;
  gatherTime: string;
  capacity: number;
  nearestStation: string;
  budget: GroupMealBudget | "";
};

interface GroupMealMetadataFormProps {
  initialValues: GroupMealMetadataFormValues;
  onSubmit: (values: GroupMealMetadataFormValues) => Promise<void> | void;
  onChange?: (values: GroupMealMetadataFormValues) => void;
  onCancel?: () => void;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  showActions?: boolean;
  autoSaveDelay?: number;
  groupMealId?: string;
  showChatButton?: boolean;
  disableChatButton?: boolean;
}

const BUDGET_OPTIONS: GroupMealBudget[] = ["UNDER_1000", "UNDER_1500", "UNDER_2000", "OVER_2000"];

export function GroupMealMetadataForm({
  initialValues,
  onSubmit,
  onChange,
  onCancel,
  submitting,
  error,
  submitLabel,
  showActions = true,
  autoSaveDelay = 0,
  groupMealId,
  showChatButton,
  disableChatButton
}: GroupMealMetadataFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialValues.title);
  const [date, setDate] = useState(initialValues.date);
  const [timeSlot, setTimeSlot] = useState(initialValues.timeSlot);
  const [gatherTime, setGatherTime] = useState(initialValues.gatherTime);
  const [capacity, setCapacity] = useState(initialValues.capacity);
  const [nearestStation, setNearestStation] = useState(initialValues.nearestStation);
  const [budget, setBudget] = useState<GroupMealBudget | "">(initialValues.budget);

  useEffect(() => {
    setTitle(initialValues.title);
    setDate(initialValues.date);
    setTimeSlot(initialValues.timeSlot);
    setGatherTime(initialValues.gatherTime);
    setCapacity(initialValues.capacity);
    setNearestStation(initialValues.nearestStation);
    setBudget(initialValues.budget);
  }, [initialValues]);

  const timeOptions = useMemo(() => {
    const options = TIME_OPTIONS[timeSlot];
    if (gatherTime && !options.includes(gatherTime)) {
      return [gatherTime, ...options];
    }
    return options;
  }, [gatherTime, timeSlot]);

  const currentValues = useMemo(
    () => ({
      title,
      date,
      timeSlot,
      gatherTime,
      capacity,
      nearestStation,
      budget,
    }),
    [title, date, timeSlot, gatherTime, capacity, nearestStation, budget]
  );

  const hasAutoSavedRef = useRef(false);
  const delayRef = useRef(autoSaveDelay);
  delayRef.current = autoSaveDelay;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const callback = onChangeRef.current;
    if (!callback) return;
    if (!hasAutoSavedRef.current) {
      hasAutoSavedRef.current = true;
      return;
    }
    const delay = delayRef.current;
    if (!delay) {
      callback(currentValues);
      return;
    }
    const timer = window.setTimeout(() => {
      callback(currentValues);
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [currentValues]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      title,
      date,
      timeSlot,
      gatherTime,
      capacity,
      nearestStation,
      budget,
    });
  };

  const canShowChatButton = showChatButton ?? Boolean(groupMealId);
  const isChatButtonDisabled = Boolean(disableChatButton || submitting || !groupMealId);
  const handleOpenChat = useCallback(() => {
    if (!groupMealId) return;
    router.push(`/group-meals/${groupMealId}/chat`);
  }, [groupMealId, router]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <ErrorBanner message={error} /> : null}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">タイトル（任意）</label>
        <input
          type="text"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">日付</label>
        <input
          type="date"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          disabled={submitting}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">時間帯</label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={timeSlot}
            onChange={(event) => setTimeSlot(event.target.value as TimeSlot)}
            disabled={submitting}
          >
            <option value="DAY">DAY（昼）</option>
            <option value="NIGHT">NIGHT（夜）</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">集合時間</label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={gatherTime}
            onChange={(event) => setGatherTime(event.target.value)}
            disabled={submitting}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">
          定員（半角数字）
        </label>
        <input
          type="number"
          min={1}
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={capacity}
          onChange={(event) => setCapacity(Number(event.target.value))}
          required
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">
          集合場所の最寄駅
        </label>
        <input
          type="text"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={nearestStation}
          onChange={(event) => setNearestStation(event.target.value)}
          disabled={submitting}
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600">予算</label>
        <select
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={budget}
          onChange={(event) =>
            setBudget(event.target.value as GroupMealBudget | "")
          }
          disabled={submitting}
        >
          <option value="">設定しない</option>
          {BUDGET_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatBudgetLabel(option)}
            </option>
          ))}
        </select>
      </div>
      {showActions !== false && (
        <div className="flex items-center justify-end gap-2 pt-2">
          {canShowChatButton ? (
            <Button
              variant="ghost"
              size="sm"
              type="button"
              disabled={Boolean(isChatButtonDisabled)}
              onClick={handleOpenChat}
              className="flex items-center gap-1"
            >
              <MessageCircle className="h-4 w-4" />
              <span>箱チャット</span>
            </Button>
          ) : null}
          {onCancel ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={submitting}
            >
              キャンセル
            </Button>
          ) : null}
          <Button type="submit" disabled={submitting}>
            {submitLabel ?? "保存する"}
          </Button>
        </div>
      )}
    </form>
  );
}

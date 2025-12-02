'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { Input } from '@/components/ui/input';
import { MeetingPlaceMap } from './MeetingPlaceMap';
import { cn } from '@/lib/utils';
import { ApiError, CreateGroupMealInput, GroupMeal, GroupMealBudget, GroupMealScheduleInput, TimeBand } from '@/lib/api';
import { useCreateGroupMeal } from '@/hooks/use-group-meals';

type GroupMealFormValues = {
  title: string;
  date: string;
  timeBand: TimeBand;
  meetingTime: string;
  placeName: string;
  placeAddress: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  budget: GroupMealBudget | null;
};

type GroupMealFormProps = {
  mode?: 'create' | 'edit';
  initialValues?: Partial<GroupMealFormValues>;
  onSuccess?: (groupMeal: GroupMeal) => void;
  onError?: (message: string | null) => void;
  redirectOnSuccess?: boolean;
  showMap?: boolean;
};

const BUDGET_OPTIONS: { value: GroupMealBudget; label: string }[] = [
  { value: 'UNDER_1000', label: '〜1000円' },
  { value: 'UNDER_1500', label: '〜1500円' },
  { value: 'UNDER_2000', label: '〜2000円' },
  { value: 'OVER_2000', label: '2000円以上' }
];

const LUNCH_TIME_OPTIONS = generateTimeOptions('10:00', '15:00');
const DINNER_TIME_OPTIONS = generateTimeOptions('18:00', '23:00');
const DEFAULT_MEETING_TIME: Record<TimeBand, string> = {
  LUNCH: '12:00',
  DINNER: '19:00'
};

function generateTimeOptions(start: string, end: string) {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  const options: string[] = [];
  for (let minute = startTotal; minute <= endTotal; minute += 30) {
    const hours = Math.floor(minute / 60)
      .toString()
      .padStart(2, '0');
    const mins = (minute % 60).toString().padStart(2, '0');
    options.push(`${hours}:${mins}`);
  }
  return options;
}

const createDefaultFormState = (): GroupMealFormValues => ({
  title: '',
  date: '',
  timeBand: 'LUNCH',
  meetingTime: DEFAULT_MEETING_TIME.LUNCH,
  placeName: '',
  placeAddress: '',
  latitude: null,
  longitude: null,
  capacity: 4,
  budget: null
});

function buildInitialFormState(initialValues?: Partial<GroupMealFormValues>): GroupMealFormValues {
  if (!initialValues) {
    return createDefaultFormState();
  }

  const base = createDefaultFormState();
  const timeBand = initialValues.timeBand ?? base.timeBand;
  const meetingTime = initialValues.meetingTime ?? DEFAULT_MEETING_TIME[timeBand];

  return {
    ...base,
    ...initialValues,
    timeBand,
    meetingTime
  };
}

export function GroupMealForm({
  mode = 'create',
  initialValues,
  onSuccess,
  onError,
  redirectOnSuccess = true,
  showMap = true
}: GroupMealFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<GroupMealFormValues>(() => buildInitialFormState(initialValues));
  const [formError, setFormError] = useState<string | null>(null);
  const createMutation = useCreateGroupMeal();

  const meetingTimeOptions = formState.timeBand === 'LUNCH' ? LUNCH_TIME_OPTIONS : DINNER_TIME_OPTIONS;
  const submitLabel = mode === 'edit' ? '更新する' : '作成する';

  const handleMapChange = (coords: { latitude: number; longitude: number }) => {
    setFormState((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
  };

  const resetForm = () => {
    setFormState(createDefaultFormState());
  };

  const handleSuccess = (groupMeal: GroupMeal) => {
    resetForm();
    onSuccess?.(groupMeal);
    if (redirectOnSuccess) {
      router.push(`/group-meals/${groupMeal.id}`);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    onError?.(null);

    if (!formState.date) {
      setFormError('日付を入力してください');
      return;
    }

    if (!formState.meetingTime) {
      setFormError('集合時間を選択してください');
      return;
    }

    if (!formState.placeName.trim()) {
      setFormError('集合場所の名称を入力してください');
      return;
    }

    if (formState.capacity < 3 || formState.capacity > 10) {
      setFormError('定員は3〜10名で設定してください');
      return;
    }

    const schedule: GroupMealScheduleInput = {
      date: formState.date,
      timeBand: formState.timeBand,
      meetingTime: formState.meetingTime,
      place: {
        name: formState.placeName.trim(),
        address: formState.placeAddress.trim() || null,
        latitude: formState.latitude,
        longitude: formState.longitude,
        googlePlaceId: null
      }
    };

    const input: CreateGroupMealInput = {
      title: formState.title.trim() || undefined,
      capacity: formState.capacity,
      budget: formState.budget ?? null,
      meetingPlace: formState.placeName.trim(),
      schedule
    };

    createMutation.mutate(input, {
      onSuccess: handleSuccess,
      onError: (error: any) => {
        const message = (error as ApiError | undefined)?.message ?? '作成に失敗しました';
        setFormError(message);
        onError?.(message);
      }
    });
  };

  return (
    <form className="space-y-6 text-sm text-slate-600" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-2">
        <span className="font-medium text-slate-900">タイトル（任意）</span>
        <Input
          placeholder="例: 金曜ランチ"
          value={formState.title}
          onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-medium text-slate-900">日付</span>
          <Input
            type="date"
            value={formState.date}
            onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-medium text-slate-900">時間帯</span>
          <select
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            value={formState.timeBand}
            onChange={(event) => {
              const nextTimeBand = event.target.value as TimeBand;
              setFormState((prev) => ({
                ...prev,
                timeBand: nextTimeBand,
                meetingTime: DEFAULT_MEETING_TIME[nextTimeBand]
              }));
            }}
          >
            <option value="LUNCH">昼</option>
            <option value="DINNER">夜</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="font-medium text-slate-900">集合時間</span>
          <select
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            value={formState.meetingTime}
            onChange={(event) => setFormState((prev) => ({ ...prev, meetingTime: event.target.value }))}
          >
            {meetingTimeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className="font-medium text-slate-900">定員</span>
          <select
            className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            value={formState.capacity}
            onChange={(event) => setFormState((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
          >
            {Array.from({ length: 8 }, (_, index) => index + 3).map((num) => (
              <option key={num} value={num}>
                {num} 名
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/60 px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-900">集合場所の名称</span>
            <Input
              placeholder="例: サイゼリヤ 高田馬場駅前店"
              value={formState.placeName}
              onChange={(event) => setFormState((prev) => ({ ...prev, placeName: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium text-slate-900">住所（任意）</span>
            <Input
              placeholder="例: 東京都新宿区○○町"
              value={formState.placeAddress}
              onChange={(event) => setFormState((prev) => ({ ...prev, placeAddress: event.target.value }))}
            />
          </label>
        </div>
        {showMap && (
          <>
            <p className="text-xs text-slate-500">
              飲食店を集合場所にすることをおすすめします。地図をクリックしてピンを置くと正確な緯度・経度が記録されます。
            </p>
            <MeetingPlaceMap latitude={formState.latitude} longitude={formState.longitude} onChange={handleMapChange} />
          </>
        )}
      </div>
      <div className="space-y-2">
        <span className="font-medium text-slate-900">予算の目安</span>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                setFormState((prev) => ({
                  ...prev,
                  budget: prev.budget === option.value ? null : option.value
                }))
              }
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
                formState.budget === option.value
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 bg-white text-slate-700'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <ErrorBanner message={formError} />
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? '作成中...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

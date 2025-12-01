'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommunityGate } from '@/components/community/community-gate';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ErrorBanner } from '@/components/error-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/forms/field';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useAuth } from '@/context/auth-context';
import { resolveProfileImageUrl } from '@/lib/profile-image';
import { cn } from '@/lib/utils';
import {
  fetchProfile,
  formatBudgetLabel,
  UpdateProfilePayload,
  updateProfile,
  uploadProfileImage
} from '@/lib/api';
import { GroupMealBudget, Profile } from '@/lib/types';
import {
  BUDGET_OPTIONS,
  BUDGET_VALUES,
  DRINKING_STYLE_OPTIONS,
  DRINKING_STYLE_VALUES,
  MEAL_STYLE_OPTIONS,
  MEAL_STYLE_VALUES,
  GO_MEAL_FREQUENCY_OPTIONS,
  GO_MEAL_FREQUENCY_VALUES,
  DRINKING_STYLE_LABELS,
  MEAL_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS
} from '@/lib/profile-labels';

const schema = z.object({
  name: z.string().min(2, '2文字以上で入力してください').max(40, '40文字以内で入力してください'),
  favoriteMeals: z.string().optional(),
  mainArea: z.string().optional(),
  subAreas: z.string().optional(),
  ngFoods: z.string().optional(),
  bio: z.string().max(500, '500文字以内で入力してください').optional(),
  defaultBudget: z.enum(BUDGET_VALUES).optional(),
  drinkingStyle: z.enum(DRINKING_STYLE_VALUES).optional(),
  mealStyle: z.enum(MEAL_STYLE_VALUES).optional(),
  goMealFrequency: z.enum(GO_MEAL_FREQUENCY_VALUES).optional()
});

type FormValues = z.infer<typeof schema>;

const parseCommaSeparated = (value?: string | null) =>
  value
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const buildCommaSeparated = (values?: string[]) => (values && values.length > 0 ? values.join(', ') : '');

const profileToFormValues = (profile: Profile): FormValues => ({
  name: profile.name ?? '',
  favoriteMeals: buildCommaSeparated(profile.favoriteMeals),
  mainArea: profile.mainArea ?? '',
  subAreas: buildCommaSeparated(profile.subAreas),
  ngFoods: buildCommaSeparated(profile.ngFoods),
  bio: profile.bio ?? '',
  defaultBudget: profile.defaultBudget ?? undefined,
  drinkingStyle: profile.drinkingStyle ?? undefined,
  mealStyle: profile.mealStyle ?? undefined,
  goMealFrequency: profile.goMealFrequency ?? undefined
});

const buildUpdatePayload = (values: FormValues): UpdateProfilePayload => ({
  name: values.name.trim(),
  favoriteMeals: parseCommaSeparated(values.favoriteMeals),
  mainArea: values.mainArea?.trim() ? values.mainArea.trim() : null,
  subAreas: parseCommaSeparated(values.subAreas),
  defaultBudget: values.defaultBudget ?? null,
  drinkingStyle: values.drinkingStyle ?? null,
  ngFoods: parseCommaSeparated(values.ngFoods),
  bio: values.bio?.trim() ? values.bio.trim() : null,
  mealStyle: values.mealStyle ?? null,
  goMealFrequency: values.goMealFrequency ?? null
});

export default function ProfilePage() {
  return (
    <CommunityGate>
      <ProfileContent />
    </CommunityGate>
  );
}

function ProfileContent() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      favoriteMeals: '',
      mainArea: '',
      subAreas: '',
      ngFoods: '',
      bio: '',
      defaultBudget: undefined,
      drinkingStyle: undefined,
      mealStyle: undefined,
      goMealFrequency: undefined
    }
  });

  const favoriteMealsInput = form.watch('favoriteMeals');
  const subAreasInput = form.watch('subAreas');
  const ngFoodsInput = form.watch('ngFoods');
  const selectedBudget = form.watch('defaultBudget');
  const selectedDrinkingStyle = form.watch('drinkingStyle');
  const selectedMealStyle = form.watch('mealStyle');
  const selectedGoMealFrequency = form.watch('goMealFrequency');

  const favoriteMealsList = parseCommaSeparated(favoriteMealsInput);
  const subAreasList = parseCommaSeparated(subAreasInput);
  const ngFoodsList = parseCommaSeparated(ngFoodsInput);

  const { data, isPending } = useQuery<Profile>({
    queryKey: ['profile', token],
    queryFn: async () => {
      if (!token) throw new Error('ログインしてください');
      setError(null);
      try {
        return await fetchProfile(token);
      } catch (err: any) {
        setError(err?.message ?? '読み込みに失敗しました');
        throw err;
      }
    },
    enabled: Boolean(token)
  });

  useEffect(() => {
    if (!data) return;
    form.reset(profileToFormValues(data));
    setImagePreviewUrl(resolveProfileImageUrl(data.profileImageUrl ?? null));
  }, [data, form]);

  const mutation = useMutation<Profile, any, UpdateProfilePayload>({
    mutationFn: (payload) => {
      if (!token) throw new Error('ログインしてください');
      return updateProfile(payload, token);
    },
    onSuccess: (profile) => {
      setSuccessMessage('プロフィールを保存しました');
      queryClient.setQueryData(['profile', token], profile);
      form.reset(profileToFormValues(profile));
    },
    onError: (err: any) => {
      setError(err?.message ?? '保存に失敗しました');
    }
  });

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setImageError(null);
    setIsUploadingImage(true);

    try {
      const updated = await uploadProfileImage(file, token);
      setImagePreviewUrl(resolveProfileImageUrl(updated.profileImageUrl ?? null));
      queryClient.setQueryData(['profile', token], updated);
    } catch (err: any) {
      console.error('Failed to upload image', err);
      setImageError(err?.message ?? '画像のアップロードに失敗しました');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccessMessage(null);

    try {
      const payload = buildUpdatePayload(values);
      await mutation.mutateAsync(payload);
    } catch (err: any) {
      setError(err?.message ?? '保存に失敗しました');
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">プロフィール</h1>
        <p className="mt-2 text-sm text-slate-500">
          ご飯にいきたいイメージが伝わるように設定しましょう。
        </p>
      </div>
      <Card>
        <ErrorBanner message={error ?? imageError} />
        {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
        {isPending ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-900">プロフィール画像</p>
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  imageUrl={imagePreviewUrl}
                  name={form.watch('name') || '新しいメンバー'}
                  size="lg"
                  className="flex-shrink-0"
                />
                <div className="flex flex-col">
                  <div className="relative inline-block">
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <Button type="button" disabled={isUploadingImage} className="rounded-full px-4">
                      {isUploadingImage ? 'アップロード中...' : '画像を選択'}
                    </Button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">顔が分かる写真をアップロードしてください。</p>
                </div>
              </div>
            </div>

            <Field label="名前" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>

            <Field label="活動エリアのイメージ">
              <div className="space-y-3">
                <Input placeholder="例: 早稲田キャンパス周辺" {...form.register('mainArea')} />
                <div>
                  <Input placeholder="サブエリアはカンマ区切りで追加" {...form.register('subAreas')} />
                  <p className="mt-2 text-xs text-slate-400">例: 高田馬場, 西早稲田</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subAreasList.length > 0 ? (
                    subAreasList.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
                      >
                        {area}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">サブエリアはまだ入力されていません</p>
                  )}
                </div>
              </div>
            </Field>

            <Field label="好きなご飯" hint="カンマ区切りで3つ程度を入力してください">
              <Input placeholder="例: 寿司, ラーメン, 焼き肉" {...form.register('favoriteMeals')} />
            </Field>
            <FavoriteMealsList meals={favoriteMealsList} className="mt-1" />

            <Field label="苦手な食べ物">
              <Input placeholder="例: パクチー, 生牡蠣" {...form.register('ngFoods')} />
              {ngFoodsList.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {ngFoodsList.map((food) => (
                    <span key={food} className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                      {food}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">苦手な食べ物があれば記入しましょう</p>
              )}
            </Field>

            <Field label="自己紹介">
              <Textarea rows={4} {...form.register('bio')} placeholder="ご飯で話したいことや雰囲気を記入" />
            </Field>

            <Field label="予算の目安">
              <div className="flex flex-wrap gap-2">
                {BUDGET_OPTIONS.map((option) => {
                  const isSelected = selectedBudget === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition',
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                      onClick={() => form.setValue('defaultBudget', option, { shouldDirty: true })}
                    >
                      {formatBudgetLabel(option as GroupMealBudget)}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="飲み方のスタイル">
              <div className="flex flex-wrap gap-2">
                {DRINKING_STYLE_OPTIONS.map((option) => {
                  const isSelected = selectedDrinkingStyle === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        'rounded-full border px-4 py-1 text-xs font-semibold transition',
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                      onClick={() => form.setValue('drinkingStyle', option, { shouldDirty: true })}
                    >
                      {DRINKING_STYLE_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="ご飯のスタイル">
              <div className="flex flex-wrap gap-2">
                {MEAL_STYLE_OPTIONS.map((option) => {
                  const isSelected = selectedMealStyle === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition',
                        isSelected
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                      onClick={() => form.setValue('mealStyle', option, { shouldDirty: true })}
                    >
                      {MEAL_STYLE_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="GO飯に行ける頻度">
              <div className="flex flex-wrap gap-2">
                {GO_MEAL_FREQUENCY_OPTIONS.map((option) => {
                  const isSelected = selectedGoMealFrequency === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition',
                        isSelected
                          ? 'border-sky-500 bg-sky-500 text-white'
                          : 'border-slate-200 bg-white text-slate-600'
                      )}
                      onClick={() => form.setValue('goMealFrequency', option, { shouldDirty: true })}
                    >
                      {GO_MEAL_FREQUENCY_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Button type="submit" className="w-full" disabled={mutation.isLoading}>
              {mutation.isLoading ? '保存中...' : '保存する'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

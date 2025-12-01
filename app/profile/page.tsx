'use client';

import { ChangeEvent, KeyboardEvent, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CommunityGate } from '@/components/community/community-gate';
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
  GroupMealBudget,
  UpdateProfileInput,
  updateProfile,
  uploadProfileImage
} from '@/lib/api';
import { DrinkingStyle, GoMealFrequency, Profile } from '@/lib/types';
import {
  BUDGET_OPTIONS,
  DRINKING_STYLE_LABELS,
  DRINKING_STYLE_OPTIONS,
  GO_MEAL_FREQUENCY_LABELS,
  GO_MEAL_FREQUENCY_OPTIONS
} from '@/lib/profile-labels';
import { FAVORITE_MEAL_OPTIONS } from '@/lib/favorite-meal-options';

const AREA_OPTIONS = [
  '池袋・新宿エリア',
  '渋谷・恵比寿エリア',
  '上野・東京エリア',
  '品川・五反田エリア',
  '早稲田・高田馬場エリア',
  '日吉・横浜エリア',
  '川崎・武蔵小杉エリア',
  '吉祥寺・三鷹エリア',
  '立川・国分寺エリア',
  '秋葉原・神田エリア',
  'お台場・豊洲エリア',
  'その他'
] as const;

const HOBBY_OPTIONS = [
  'ビジネス',
  'アニメ',
  'アイドル',
  '漫画',
  '映画',
  '音楽',
  'スポーツ観戦',
  '筋トレ',
  'カフェ巡り',
  'ボードゲーム'
] as const;

const schema = z.object({
  name: z.string().min(2, '2文字以上で入力してください').max(40, '40文字以内で入力してください'),
  bio: z.string().max(500, '500文字以内で入力してください').optional()
});

type FormValues = z.infer<typeof schema>;

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

  const [areas, setAreas] = useState<string[]>([]);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [ngFoods, setNgFoods] = useState<string[]>([]);
  const [ngFoodInput, setNgFoodInput] = useState('');
  const [defaultBudget, setDefaultBudget] = useState<GroupMealBudget | null>(null);
  const [drinkingStyle, setDrinkingStyle] = useState<DrinkingStyle | null>(null);
  const [goMealFrequency, setGoMealFrequency] = useState<GoMealFrequency | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      bio: ''
    }
  });

  const toggleSelection = (
    option: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter((prev) =>
      prev.includes(option) ? prev.filter((value) => value !== option) : [...prev, option]
    );
  };

  const addNgFood = () => {
    const value = ngFoodInput.trim();
    if (!value || ngFoods.includes(value)) return;
    setNgFoods((prev) => [...prev, value]);
    setNgFoodInput('');
  };

  const removeNgFood = (food: string) => {
    setNgFoods((prev) => prev.filter((item) => item !== food));
  };

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
    form.reset({
      name: data.name ?? '',
      bio: data.bio ?? ''
    });
    setImagePreviewUrl(resolveProfileImageUrl(data.profileImageUrl ?? null));
    setAreas(data.areas && data.areas.length > 0 ? data.areas : data.subAreas);
    setFavoriteMeals(data.favoriteMeals ?? []);
    setHobbies(data.hobbies ?? []);
    setNgFoods(data.ngFoods ?? []);
    setDefaultBudget(data.defaultBudget ?? null);
    setDrinkingStyle(data.drinkingStyle ?? null);
    setGoMealFrequency(data.goMealFrequency ?? null);
    setSuccessMessage(null);
  }, [data, form]);

  const mutation = useMutation<Profile, any, UpdateProfileInput>({
    mutationFn: (payload) => {
      if (!token) throw new Error('ログインしてください');
      return updateProfile(payload, token);
    },
    onSuccess: (profile) => {
      setSuccessMessage('プロフィールを保存しました');
      queryClient.setQueryData(['profile', token], profile);
      form.reset({
        name: profile.name ?? '',
        bio: profile.bio ?? ''
      });
      setAreas(profile.areas && profile.areas.length > 0 ? profile.areas : profile.subAreas);
      setFavoriteMeals(profile.favoriteMeals ?? []);
      setHobbies(profile.hobbies ?? []);
      setNgFoods(profile.ngFoods ?? []);
      setDefaultBudget(profile.defaultBudget ?? null);
      setDrinkingStyle(profile.drinkingStyle ?? null);
      setGoMealFrequency(profile.goMealFrequency ?? null);
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

  const handleNgFoodKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addNgFood();
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setError(null);
    setSuccessMessage(null);

    try {
      const payload: UpdateProfileInput = {
        name: values.name.trim(),
        bio: values.bio?.trim() ? values.bio.trim() : null,
        favoriteMeals,
        ngFoods,
        areas,
        hobbies,
        defaultBudget,
        drinkingStyle,
        goMealFrequency
      };
      await mutation.mutateAsync(payload);
    } catch (err: any) {
      setError(err?.message ?? '保存に失敗しました');
    }
  });

  const renderChips = (
    options: readonly string[],
    selected: string[],
    onToggle: (value: string) => void,
    description?: string
  ) => (
    <>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
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
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
      {description ? <p className="text-xs text-slate-400">{description}</p> : null}
    </>
  );

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

            <Field label="よく行く場所">
              <div className="space-y-2">
                {renderChips(AREA_OPTIONS, areas, (option) => toggleSelection(option, areas, setAreas))}
              </div>
            </Field>

            <Field label="好きなご飯">
              <div className="space-y-2">
                {renderChips(FAVORITE_MEAL_OPTIONS, favoriteMeals, (option) =>
                  toggleSelection(option, favoriteMeals, setFavoriteMeals)
                )}
              </div>
            </Field>

            <Field label="趣味">
              <div className="space-y-2">
                {renderChips(HOBBY_OPTIONS, hobbies, (option) => toggleSelection(option, hobbies, setHobbies))}
              </div>
            </Field>

            <Field label="苦手な食べ物">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="パクチー"
                    value={ngFoodInput}
                    onChange={(event) => setNgFoodInput(event.target.value)}
                    onKeyDown={handleNgFoodKeyDown}
                  />
                  <Button type="button" onClick={addNgFood} disabled={!ngFoodInput.trim()}>
                    追加
                  </Button>
                </div>
                {ngFoods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {ngFoods.map((food) => (
                      <span key={food} className="flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                        {food}
                        <button
                          type="button"
                          onClick={() => removeNgFood(food)}
                          className="rounded-full border border-rose-200 px-2 py-0.5 text-[10px]"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">苦手な食べ物があれば少しずつ追加しましょう</p>
                )}
              </div>
            </Field>

            <Field label="自己紹介">
              <Textarea rows={4} {...form.register('bio')} placeholder="ご飯で話したいことや雰囲気を記入" />
            </Field>

            <Field label="予算の目安">
              <div className="flex flex-wrap gap-2">{BUDGET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition',
                    defaultBudget === option
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  )}
                  onClick={() => setDefaultBudget((prev) => (prev === option ? null : option))}
                >
                  {formatBudgetLabel(option as GroupMealBudget)}
                </button>
              ))}</div>
            </Field>

            <Field label="飲み方のスタイル">
              <div className="flex flex-wrap gap-2">
                {DRINKING_STYLE_OPTIONS.map((option) => {
                  const isSelected = drinkingStyle === option;
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
                      onClick={() => setDrinkingStyle((prev) => (prev === option ? null : option))}
                    >
                      {DRINKING_STYLE_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="GO飯に行ける頻度">
              <div className="flex flex-wrap gap-2">
                {GO_MEAL_FREQUENCY_OPTIONS.map((option) => {
                  const isSelected = goMealFrequency === option;
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
                      onClick={() => setGoMealFrequency((prev) => (prev === option ? null : option))}
                    >
                      {GO_MEAL_FREQUENCY_LABELS[option]}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Button type="submit" className="w-full" disabled={mutation.status === 'pending'}>
              {mutation.status === 'pending' ? '保存中...' : '保存する'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

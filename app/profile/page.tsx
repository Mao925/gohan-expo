// app/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CommunityGate } from '@/components/community/community-gate';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ErrorBanner } from '@/components/error-banner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/forms/field';
import { useAuth } from '@/context/auth-context';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import { FAVORITE_MEAL_OPTIONS } from '@/lib/favorite-meal-options';
import type { Profile } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, '2文字以上で入力してください'),
  favoriteMeals: z.array(z.string()).max(3)
});

// バックエンドのレスポンスで profileImageUrl を返している前提
type ProfileResponse = Profile & {
  profileImageUrl?: string | null;
};

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
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', favoriteMeals: [] }
  });

  const { data, isPending } = useQuery<ProfileResponse>({
    queryKey: ['profile', token],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch('/api/profile', { token });
      } catch (err: any) {
        setError(err?.message ?? '読み込みに失敗しました');
        throw err;
      }
    },
    enabled: Boolean(token)
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name,
        favoriteMeals: data.favoriteMeals ?? []
      });
      setPreviewUrl(data.profileImageUrl ?? null);
    }
  }, [data, form]);

  const mutation = useMutation<ProfileResponse, any, FormValues>({
    mutationFn: (values) =>
      apiFetch('/api/profile', {
        method: 'PUT',
        data: { name: values.name, favoriteMeals: values.favoriteMeals },
        token
      })
  });

  // プロフィール画像アップロード
  const imageMutation = useMutation<ProfileResponse, any, File>({
    mutationFn: async (file: File) => {
      if (!token) {
        throw new Error('ログイン情報が見つかりません。再度ログインしてください。');
      }
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(new URL('/api/profile/image', API_BASE_URL).toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message ?? '画像のアップロードに失敗しました');
      }

      return (await res.json()) as ProfileResponse;
    },
    onSuccess: (updated) => {
      setPreviewUrl(updated.profileImageUrl ?? null);
      setImageError(null);
    },
    onError: (err: any) => {
      setImageError(err?.message ?? '画像のアップロードに失敗しました');
      setPreviewUrl(data?.profileImageUrl ?? null);
    }
  });

  const handleClickSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError(null);

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    imageMutation.mutate(file, {
      onSettled: () => {
        URL.revokeObjectURL(localUrl);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">プロフィール</h1>
        <p className="mt-2 text-sm text-slate-500">
          ご飯にいきたいイメージが伝わるように書いてみましょう。
        </p>
      </div>
      <Card>
        <ErrorBanner message={error ?? imageError} />
        {isPending ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : (
          <form
            className="space-y-6"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await mutation.mutateAsync(values);
              } catch (err: any) {
                setError(err?.message ?? '保存に失敗しました');
              }
            })}
          >
            {/* プロフィール画像セクション */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-slate-700">プロフィール画像</h2>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-400">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="プロフィール画像"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>画像なし</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleClickSelectFile}
                      disabled={imageMutation.isPending}
                      className="rounded-full px-4"
                    >
                      {imageMutation.isPending ? 'アップロード中...' : '画像を選択'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    顔が分かる写真をアップロードしてください。
                  </p>
                </div>
              </div>
            </section>

            {/* 名前 */}
            <Field label="名前" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>

            {/* 好きなご飯 */}
            <FavoriteMealsSelector
              selected={form.watch('favoriteMeals')}
              onChange={(next) => form.setValue('favoriteMeals', next)}
              error={form.formState.errors.favoriteMeals?.message as string | undefined}
            />

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '保存中...' : '保存する'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

// ===== 好きなご飯セレクター =====

type FavoriteMealsSelectorProps = {
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string;
};

function FavoriteMealsSelector({ selected, onChange, error }: FavoriteMealsSelectorProps) {
  const current = selected ?? [];

  const toggleMeal = (meal: string) => {
    onChange(
      current.includes(meal)
        ? current.filter((m) => m !== meal)
        : current.length >= 3
          ? current
          : [...current, meal]
    );
  };

  return (
    <Field
      label="好きなご飯（最大3つまで）"
      hint="好きなご飯を選択してください。3つまで選べます。"
      error={error}
    >
      <div className="space-y-3">
        <FavoriteMealsList meals={current} placeholder="好きなご飯: 未設定" />
        <div className="flex flex-wrap gap-2">
          {FAVORITE_MEAL_OPTIONS.map((meal) => {
            const isSelected = current.includes(meal);
            const disabled = !isSelected && current.length >= 3;
            return (
              <button
                key={meal}
                type="button"
                onClick={() => toggleMeal(meal)}
                disabled={disabled}
                className={`
                  rounded-full border px-4 py-2 text-sm font-semibold transition
                  ${
                    isSelected
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand/50 hover:bg-brand/5'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                `}
              >
                {meal}
              </button>
            );
          })}
        </div>
        {current.length >= 3 ? (
          <p className="text-xs text-slate-500">これ以上は選択できません。</p>
        ) : null}
      </div>
    </Field>
  );
}

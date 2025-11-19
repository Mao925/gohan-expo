'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/forms/field';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { Profile } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, '2文字以上で入力してください'),
  bio: z.string().min(10, '10文字以上で入力してください')
});

type FormValues = z.infer<typeof schema>;

export default function ProfilePage() {
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', bio: '' }
  });

  const { data, isPending } = useQuery<Profile>({
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
      form.reset({ name: data.name, bio: data.bio });
    }
  }, [data, form]);

  const mutation = useMutation<Profile, any, FormValues>({
    mutationFn: (values) => apiFetch('/api/profile', { method: 'PUT', data: values, token })
  });

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">まずはログインしてください。</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">プロフィール</h1>
        <p className="mt-2 text-sm text-slate-500">ご飯にいきたいイメージが伝わるように書いてみましょう。</p>
      </div>
      <Card>
        <ErrorBanner message={error} />
        {isPending ? (
          <p className="text-slate-500">読み込み中...</p>
        ) : (
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(async (values) => {
              setError(null);
              try {
                await mutation.mutateAsync(values);
              } catch (err: any) {
                setError(err?.message ?? '保存に失敗しました');
              }
            })}
          >
            <Field label="名前" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field
              label="どんな人とご飯に行きたいか"
              error={form.formState.errors.bio?.message}
              hint="例）落ち着いた雰囲気が好きで、美味しいものを楽しめる人と話がしたいです"
            >
              <Textarea rows={5} {...form.register('bio')} />
            </Field>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? '保存中...' : '保存する'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/forms/field';
import { ErrorBanner } from '@/components/error-banner';
import { useAuth } from '@/context/auth-context';

const schema = z.object({
  name: z.string().min(2, '2文字以上で入力してください'),
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(6, '6文字以上で入力してください')
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await registerUser(values);
      router.push('/profile');
    } catch (err: any) {
      setError(err?.message ?? '登録に失敗しました');
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="text-2xl font-semibold text-slate-900">新規登録</h2>
      <p className="mt-2 text-sm text-slate-600">まずは基本情報を登録しましょう。</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <Field label="名前" error={errors.name?.message}>
          <Input placeholder="山田 太郎" {...register('name')} />
        </Field>
        <Field label="メールアドレス" error={errors.email?.message}>
          <Input type="email" placeholder="you@example.com" {...register('email')} />
        </Field>
        <Field label="パスワード" error={errors.password?.message}>
          <Input type="password" placeholder="•••••••" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : '登録する'}
        </Button>
        <p className="text-center text-sm text-slate-600">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/login" className="text-brand">
            ログインはこちら
          </Link>
        </p>
      </form>
    </Card>
  );
}

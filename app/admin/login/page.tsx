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
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(6, '6文字以上で入力してください')
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await adminLogin({ email: values.email, password: values.password });
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message ?? '管理者ログインに失敗しました');
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin only</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">管理者ログイン</h1>
      <p className="mt-2 text-sm text-slate-600">管理者として許可されたメール / パスワードでログインしてください。</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <Field label="メールアドレス" error={errors.email?.message}>
          <Input type="email" placeholder="admin@example.com" {...register('email')} />
        </Field>
        <Field label="パスワード" error={errors.password?.message}>
          <Input type="password" placeholder="•••••••" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : 'ダッシュボードに入る'}
        </Button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm text-slate-500">
        <p>
          通常ユーザーのログインは{' '}
          <Link href="/login" className="text-brand">
            こちら
          </Link>
        </p>
        <p>
          管理者登録が必要な場合は{' '}
          <Link href="/admin/register" className="text-brand">
            管理者登録フォーム
          </Link>
          へ
        </p>
      </div>
    </Card>
  );
}

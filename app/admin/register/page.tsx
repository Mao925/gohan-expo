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
  password: z.string().min(6, '6文字以上で入力してください'),
  adminInviteCode: z.string().min(4, '管理者確認コードを入力してください')
});

type FormValues = z.infer<typeof schema>;

export default function AdminRegisterPage() {
  const router = useRouter();
  const { adminRegister } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', adminInviteCode: '' }
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await adminRegister(values);
      router.push('/admin');
    } catch (err: any) {
      setError(err?.message ?? '管理者登録に失敗しました');
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin only</p>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">管理者登録</h1>
      <p className="mt-2 text-sm text-slate-600">管理者用の招待コードをお持ちの方のみ登録できます。</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <Field label="名前" error={errors.name?.message}>
          <Input placeholder="山田 太郎" {...register('name')} />
        </Field>
        <Field label="メールアドレス" error={errors.email?.message}>
          <Input type="email" placeholder="admin@example.com" {...register('email')} />
        </Field>
        <Field label="パスワード" error={errors.password?.message}>
          <Input type="password" placeholder="•••••••" {...register('password')} />
        </Field>
        <Field label="管理者確認コード" error={errors.adminInviteCode?.message}>
          <Input placeholder="ADMINCODE" {...register('adminInviteCode')} />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : '管理者として登録'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        すでに管理者アカウントをお持ちですか？{' '}
        <Link href="/admin/login" className="text-brand">
          ログインはこちら
        </Link>
      </p>
    </Card>
  );
}

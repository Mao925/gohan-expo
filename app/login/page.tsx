'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { LineOpenInBrowserScreen } from '@/components/LineOpenInBrowserScreen';
import { useLineInAppBrowserEnvironment } from '@/hooks/useLineInAppBrowserEnvironment';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/forms/field';
import { ErrorBanner } from '@/components/error-banner';
import { useAuth } from '@/context/auth-context';
import { ApiError, API_BASE_URL, SERVER_UNAVAILABLE_MESSAGE } from '@/lib/api';

const seedEmail = process.env.NEXT_PUBLIC_SEED_EMAIL;
const seedPassword = process.env.NEXT_PUBLIC_SEED_PASSWORD;
const showSeedInfo =
  process.env.NODE_ENV !== 'production' && Boolean(seedEmail && seedPassword);

const schema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(6, '6文字以上で入力してください')
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lineError = searchParams.get('lineError');

  const initialError: string | null =
    lineError === 'NOT_REGISTERED'
      ? 'このLINEアカウントではまだ新規登録が完了していません。「新規登録」からアカウントを作成してください。'
      : null;

  const [error, setError] = useState<string | null>(initialError);
  const [forceContinue, setForceContinue] = useState(false);

  const { isClient, isLineInAppBrowser, platform, currentUrl } =
    useLineInAppBrowserEnvironment();
  const showLineWarning =
    isClient && isLineInAppBrowser && !forceContinue;

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
      await login(values);
      router.push('/community/join');
    } catch (err: any) {
      const apiError = err as ApiError | undefined;
      if (apiError?.status === 401) {
        setError('メールアドレスまたはパスワードが正しくありません。確認のうえ再度お試しください。');
      } else if (apiError?.isServerError) {
        setError(SERVER_UNAVAILABLE_MESSAGE);
      } else {
        setError(apiError?.message ?? 'ログインに失敗しました');
      }
    }
  };

  const handleLineLogin = () => {
    const url = new URL('/api/auth/line/login', API_BASE_URL);
    url.searchParams.set('mode', 'login'); // ★ ログインモード
    window.location.href = url.toString();
  };

  if (showLineWarning) {
    return (
      <LineOpenInBrowserScreen
        platform={platform}
        currentUrl={currentUrl}
        onContinue={() => setForceContinue(true)}
      />
    );
  }

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="text-2xl font-semibold text-slate-900">ログイン</h2>
      <p className="mt-2 text-sm text-slate-600">コミュニティに参加するにはログインしてください。</p>
      <ErrorBanner message={error} />
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
        <Field label="メールアドレス" error={errors.email?.message}>
          <Input
            type="email"
            autoComplete="email"
            placeholder="your@email.com"
            {...register('email')}
          />
        </Field>
        <Field label="パスワード" error={errors.password?.message}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="•••••••"
            {...register('password')}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '送信中...' : 'ログイン'}
        </Button>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />
          <span>または</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <Button
          type="button"
          className="w-full bg-[#06c755] text-white hover:bg-[#05b24c]"
          onClick={handleLineLogin}
        >
          LINEでログイン
        </Button>
        <p className="text-center text-sm text-slate-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/register" className="text-brand">
            新規登録はこちら
          </Link>
        </p>
      </form>
    </Card>
  );
}

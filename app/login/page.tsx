'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { API_BASE_URL } from '@/lib/api';
import { resolveSafeRedirect } from '@/lib/redirect';

const LINE_NOT_REGISTERED_MESSAGE =
  'このLINEアカウントではまだ新規登録が完了していません。「新規登録」からアカウントを作成してください。';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const lineError = searchParams.get('lineError');
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = resolveSafeRedirect(redirectParam);
  const [isLoading, setIsLoading] = useState(false);
  const errorMessage = lineError === 'NOT_REGISTERED' ? LINE_NOT_REGISTERED_MESSAGE : null;

  const startLineLogin = () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const url = new URL('/api/auth/line/login', API_BASE_URL);
    url.searchParams.set('mode', 'login');

    if (safeRedirect) {
      url.searchParams.set('redirect', safeRedirect);
    }

    window.location.href = url.toString();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-lg shadow-slate-900/10">
        <h1 className="text-2xl font-bold text-slate-900">ログイン</h1>
        <p className="mt-2 text-sm text-slate-600">コミュニティに参加するにはログインしてください。</p>
        <div className="mt-4">
          <ErrorBanner message={errorMessage} />
        </div>
        <div className="mt-4">
          <Button
            className="w-full bg-[#06C755] text-white hover:bg-[#05B24C]"
            onClick={startLineLogin}
            disabled={isLoading}
          >
            {isLoading ? 'LINEを起動中...' : 'LINEでログイン'}
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">
            まだアカウントをお持ちでない方
          </p>
          <Button
            variant="outline"
            className="w-full border-red-500 text-red-500 bg-white hover:bg-red-50"
            asChild
          >
            <Link href="/register">新規登録はこちら</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

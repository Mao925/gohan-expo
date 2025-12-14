'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { API_BASE_URL } from '@/lib/api';
import { resolveSafeRedirect } from '@/lib/redirect';

const lineErrorMessage =
  'このLINEアカウントではまだ新規登録が完了していません。「新規登録」からアカウントを作成してください。';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const lineError = searchParams.get('lineError');
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = useMemo(() => resolveSafeRedirect(redirectParam), [redirectParam]);

  const initialError: string | null =
    lineError === 'NOT_REGISTERED' ? lineErrorMessage : null;
  const [error] = useState<string | null>(initialError);

  const handleLineLogin = () => {
    const url = new URL('/api/auth/line/login', API_BASE_URL);
    url.searchParams.set('mode', 'login');
    if (safeRedirect) {
      url.searchParams.set('redirect', safeRedirect);
    }
    window.location.href = url.toString();
  };

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="text-2xl font-semibold text-slate-900">ログイン</h2>
      <p className="mt-2 text-sm text-slate-600">
        コミュニティに参加するにはログインしてください。
      </p>

      <ErrorBanner message={error} />

      <div className="mt-6 space-y-5">
        <Button
          type="button"
          className="w-full bg-[#06c755] text-white hover:bg-[#05b24c]"
          onClick={handleLineLogin}
        >
          LINEでログイン
        </Button>

        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">
            まだアカウントをお持ちでない方
          </p>
          <Button
            variant="outline"
            className="w-full border-[var(--brand)] text-[var(--brand)] bg-white hover:bg-[var(--brand)]/10"
            asChild
          >
            <Link href="/register">新規登録はこちら</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

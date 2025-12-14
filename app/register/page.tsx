'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { API_BASE_URL } from '@/lib/api';
import { resolveSafeRedirect } from '@/lib/redirect';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const safeRedirect = useMemo(() => resolveSafeRedirect(redirectParam), [redirectParam]);
  const [error] = useState<string | null>(null);

  const handleLineRegister = () => {
    const url = new URL('/api/auth/line/login', API_BASE_URL);
    url.searchParams.set('mode', 'register');
    if (safeRedirect) {
      url.searchParams.set('redirect', safeRedirect);
    }
    window.location.href = url.toString();
  };

  return (
    <Card className="mx-auto max-w-md">
      <h2 className="text-2xl font-semibold text-slate-900">新規登録</h2>
      <p className="mt-2 text-sm text-slate-600">
        LINEアカウントでコミュニティに参加するには新規登録を完了してください。
      </p>

      <ErrorBanner message={error} />

      <div className="mt-6 space-y-5">
        <Button
          type="button"
          className="w-full bg-[#06c755] text-white hover:bg-[#05b24c]"
          onClick={handleLineRegister}
        >
          LINEで新規登録
        </Button>

        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">すでにアカウントをお持ちの方</p>
          <Button
            variant="outline"
            className="w-full border-[var(--brand)] text-[var(--brand)] bg-white hover:bg-[var(--brand)]/10"
            asChild
          >
            <Link href="/login">ログインはこちら</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

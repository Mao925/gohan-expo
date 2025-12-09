'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '@/lib/api';

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('inviteToken');
  const [isLoading, setIsLoading] = useState(false);

  const startLineRegister = () => {
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    const url = new URL('/api/auth/line/register', API_BASE_URL);

    if (inviteToken) {
      url.searchParams.set('inviteToken', inviteToken);
    }

    window.location.href = url.toString();
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white/90 p-8 shadow-lg shadow-slate-900/10">
        <h1 className="text-2xl font-bold text-slate-900">新規登録</h1>
        <p className="mt-2 text-sm text-slate-600">
          GO飯を利用するには、LINEでアカウントを連携してください。
        </p>
        <div className="mt-6">
          <Button
            className="w-full bg-[#06C755] text-white hover:bg-[#05B24C]"
            onClick={startLineRegister}
            disabled={isLoading}
          >
            {isLoading ? 'LINEを起動中...' : 'LINEで新規登録'}
          </Button>
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-center text-sm text-slate-600">
            すでにアカウントをお持ちの方
          </p>
          <Button
            variant="outline"
            className="w-full border-red-500 text-red-500 bg-white hover:bg-red-50"
            asChild
          >
            <Link href="/login">ログインはこちら</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

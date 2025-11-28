// frontend/app/auth/line/callback/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';

type Status = 'loading' | 'success' | 'error';

export default function LineCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('LINEアカウントでの認証を確認しています...');

  const token = searchParams.get('token');
  const newUserParam = searchParams.get('newUser') ?? '';
  const errorParam = searchParams.get('error');
  const isNewUser = newUserParam.toLowerCase() === 'true';

  // 🔹 新規登録時のみオンボーディングへ
  const destination = useMemo(
    () => (isNewUser ? '/onboarding' : '/community/join'),
    [isNewUser]
  );

  useEffect(() => {
    console.log('[LINE CALLBACK] token, newUserParam, isNewUser, errorParam', {
      token,
      newUserParam,
      isNewUser,
      errorParam,
      destination,
    });

    // login intent で user が存在しなかったケース
    if (errorParam === 'not_registered') {
      setStatus('error');
      setMessage(
        'このLINEアカウントではまだ新規登録が完了していません。「新規登録」からアカウントを作成してください。'
      );
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('認証情報が見つかりませんでした。ログインからやり直してください。');
      return;
    }

    (async () => {
      try {
        await loginWithToken(token);
        setStatus('success');
        setMessage(
          isNewUser
            ? '登録が完了しました。オンボーディングに進みます。'
            : 'ログインに成功しました。コミュニティに移動します。'
        );
        router.replace(destination);
      } catch (error) {
        console.error('LINE login failed', error);
        setStatus('error');
        setMessage('ログインに失敗しました。お手数ですが再度お試しください。');
      }
    })();
  }, [destination, isNewUser, loginWithToken, router, token, newUserParam, errorParam]);

  return (
    <Card className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">LINE認証</h1>
      <p className="text-sm text-slate-600">{message}</p>
      {status === 'loading' ? (
        <p className="text-sm text-slate-500">しばらくお待ちください...</p>
      ) : null}
      {status === 'success' ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            自動でページが切り替わらない場合はこちらを押してください。
          </p>
          <Button asChild className="w-full">
            <Link href={destination}>次へ進む</Link>
          </Button>
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">ログインに戻る</Link>
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

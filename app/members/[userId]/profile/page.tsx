'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CommunityGate } from '@/components/community/community-gate';
import { FavoriteMealsList } from '@/components/favorite-meals-list';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PublicUserProfile, fetchPublicUserProfile, formatBudgetLabel } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  DRINKING_STYLE_LABELS,
  GO_MEAL_FREQUENCY_LABELS
} from '@/lib/profile-labels';

type LoadState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'notFound'
  | 'unauthorized'
  | 'error';

export default function MemberProfilePage() {
  return (
    <CommunityGate>
      <MemberProfileContent />
    </CommunityGate>
  );
}

function MemberProfileContent() {
  const router = useRouter();
  const params = useParams<{ userId: string }>();

  const [state, setState] = useState<LoadState>('idle');
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);

  useEffect(() => {
    if (!params?.userId) return;

    let cancelled = false;

    const run = async () => {
      setState('loading');
      setProfile(null);

      try {
        const data = await fetchPublicUserProfile(params.userId);
        if (cancelled) return;
        setProfile(data);
        setState('loaded');
      } catch (error: any) {
        if (cancelled) return;
        const statusCode = Number(error?.status ?? error?.code ?? 0);
        if (statusCode === 401) {
          setState('unauthorized');
        } else if (statusCode === 400 || statusCode === 404) {
          setState('notFound');
        } else {
          setState('error');
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [params?.userId]);

  const handleBack = () => {
    router.back();
  };

  const areas = profile?.areas ?? [];
  const hasAreas = areas.length > 0;
  const budgetLabel = formatBudgetLabel(profile?.defaultBudget ?? null);
  const drinkingStyleLabel = profile?.drinkingStyle
    ? DRINKING_STYLE_LABELS[profile.drinkingStyle]
    : null;
  const goMealFrequencyLabel = profile?.goMealFrequency
    ? GO_MEAL_FREQUENCY_LABELS[profile.goMealFrequency]
    : null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-4 pb-20">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="inline-flex items-center gap-1 rounded-full text-sm font-semibold text-slate-600"
              >
                <ArrowLeft className="h-4 w-4" />
                戻る
              </Button>
              <p className="text-sm font-semibold text-slate-900">メンバープロフィール</p>
              <div className="w-8" />
            </div>
            <p className="text-xs text-slate-500">
              他のメンバーの公開プロフィールをじっくり眺める画面です。
            </p>
          </div>

        {state === 'loading' && (
          <Card className="space-y-2">
            <p className="text-sm text-slate-600">プロフィールを読み込み中です…</p>
          </Card>
        )}

        {state === 'unauthorized' && (
          <Card className="space-y-2">
            <p className="text-sm text-slate-600">
              ログインの有効期限が切れた可能性があります。再度ログインし直してください。
            </p>
          </Card>
        )}

        {state === 'notFound' && (
          <Card className="space-y-2">
            <p className="text-sm text-slate-600">
              このメンバーのプロフィールは閲覧できません。
            </p>
          </Card>
        )}

        {state === 'error' && (
          <Card className="space-y-2">
            <p className="text-sm text-slate-600">
              プロフィールの取得に失敗しました。時間をおいて再度お試しください。
            </p>
          </Card>
        )}

        {state === 'loaded' && profile && (
          <div className="space-y-4">
            <Card className="space-y-4">
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  imageUrl={profile.profileImageUrl ?? undefined}
                  name={profile.name}
                  size="lg"
                />
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-xs text-slate-500">
                    プロフィール完成度 {profile.completionRate}%
                  </p>
                  <p
                    className={cn(
                      'text-sm',
                      profile.bio ? 'text-slate-700' : 'text-xs text-slate-500'
                    )}
                  >
                    {profile.bio ?? '未設定'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">GO飯スタイル</h2>
                <span className="text-xs text-slate-500">公開中の項目です</span>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500">よく行く場所</p>
                  {hasAreas ? (
                    <div className="flex flex-wrap gap-2">
                      {areas.map((area, index) => (
                        <span
                          key={`${area}-${index}`}
                          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">未設定</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">飲み方</p>
                  <p className="mt-1 text-slate-700">
                    {drinkingStyleLabel ?? '未設定'}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">GO飯頻度</p>
                  <p className="mt-1 text-slate-700">
                    {goMealFrequencyLabel ?? '未設定'}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-slate-500">予算の目安</p>
                  <p className="mt-1 text-slate-700">
                    {budgetLabel ?? '未設定'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">ご飯の好み</h2>
                <span className="text-xs text-slate-500">好きな/苦手な料理</span>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">好きなご飯</p>
                {profile.favoriteMeals.length > 0 ? (
                  <FavoriteMealsList meals={profile.favoriteMeals} variant="pill" />
                ) : (
                  <p className="text-xs text-slate-500">未設定</p>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500">NGなご飯</p>
                {profile.ngFoods.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.ngFoods.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">未設定</p>
                )}
              </div>
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">趣味・関心</h2>
                <span className="text-xs text-slate-500">どんな話題が好きか</span>
              </div>
              {profile.hobbies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.hobbies.map((hobby) => (
                    <span
                      key={hobby}
                      className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      {hobby}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">未設定</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

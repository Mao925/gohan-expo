import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GroupMealForm } from '../_components/GroupMealForm';

export default async function NewGroupMealPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold md:text-2xl">新しい箱を作る</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            タイトル・日付・集合時間・集合場所などを入力して、みんなでGO飯の箱を作成します。
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/group-meals" className="text-sm">
            一覧に戻る
          </Link>
        </Button>
      </header>

      <section className="rounded-2xl border bg-background p-4 shadow-sm md:p-6">
        <GroupMealForm mode="create" showMap={false} />
      </section>
    </main>
  );
}

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-10">
      <section className="text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Community only</p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
          同じコミュニティの仲間だけで<br />安心してご飯にいける場所
        </h1>
        <p className="mt-4 text-base text-slate-600">
          お互いに「行きたい」と思った人だけがマッチして、自然なご飯のきっかけを作れます。
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/match/like">今すぐはじめる</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/members">コミュニティを見る</Link>
          </Button>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: '相互でマッチ',
            body: 'お互い「行きたい」を押した人だけがマッチします。安心してアクションできます。'
          },
          {
            title: 'コミュニティ限定',
            body: '同じコミュニティ内で承認された人だけが対象です。変な出会いはありません。'
          },
          {
            title: '余計な機能なし',
            body: 'チャット機能はあえて用意していません。マッチ後は自分たちで連絡を。'
          }
        ].map((item) => (
          <Card key={item.title}>
            <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-3 text-sm text-slate-600">{item.body}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}

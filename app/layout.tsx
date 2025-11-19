import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { AppShell } from '@/components/layout/app-shell';

export const metadata: Metadata = {
  title: 'ごはんコミュニティ',
  description: '同じコミュニティのメンバーとだけマッチングしてご飯に行くWebアプリ'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

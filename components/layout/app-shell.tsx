"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const baseNavItems = [
  { href: "/members", label: "メンバー" },
  { href: "/match/like", label: "ご飯に行きたい" },
  { href: "/matches", label: "マッチ一覧" },
  { href: "/community/join", label: "コミュニティ申請" },
  { href: "/profile", label: "プロフィール" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const navItems = user?.isAdmin
    ? [...baseNavItems, { href: "/admin", label: "承認待ち" }]
    : baseNavItems;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff9f2] text-slate-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-wide text-slate-900"
          >
            gohan<span className="text-brand">.circle</span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 font-medium text-slate-500 transition-colors hover:bg-orange-50 hover:text-slate-900",
                  pathname?.startsWith(item.href) &&
                    "bg-orange-100 text-slate-900"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.name}
              </span>
            ) : null}
            {user ? (
              <Button variant="ghost" size="sm" onClick={logout}>
                ログアウト
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/admin/login">管理者</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <div className="md:hidden mb-6 flex gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-full border border-orange-100 px-4 py-2 text-sm text-slate-500",
                pathname?.startsWith(item.href) &&
                  "bg-orange-100 text-slate-900"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </div>
  );
}

"use client";

import { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  HeartHandshake,
  Megaphone,
  ShieldCheck,
  UserRound,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/members", label: "メンバー", icon: Users },
  { href: "/match/like", label: "ご飯に行きたい", icon: HeartHandshake },
  { href: "/availability", label: "日程調整", icon: CalendarDays },
  { href: "/group-meals", label: "みんなでGO飯", icon: UtensilsCrossed },
  { href: "/community/join", label: "コミュニティ申請", icon: Megaphone },
  { href: "/profile", label: "プロフィール", icon: UserRound },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  const navItems: NavItem[] = user?.isAdmin
    ? [
        ...BASE_NAV_ITEMS.filter((item) => item.href !== "/availability"),
        { href: "/admin", label: "承認待ち", icon: ShieldCheck },
      ]
    : BASE_NAV_ITEMS;

  const mobileNavItems: NavItem[] = navItems;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fffaf3] text-slate-500">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#fffaf3] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-orange-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-lg font-semibold tracking-wide text-slate-900"
          >
            gohan<span className="text-brand">.circle</span>
          </Link>

          <nav className="hidden items-center gap-2 text-sm md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 font-medium text-slate-500 transition-colors hover:bg-orange-50 hover:text-slate-900",
                  isActive(href) && "bg-orange-100 text-slate-900"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.name}
              </span>
            ) : null}
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => logout?.()}>
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-16 md:pb-14">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition",
                isActive(href)
                  ? "text-orange-600"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {Icon ? <Icon className="h-5 w-5" /> : null}
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

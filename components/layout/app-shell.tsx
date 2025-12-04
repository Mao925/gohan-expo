"use client";

import { ComponentType, ReactNode, createContext, useContext, useMemo, useState } from "react";
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
import { useCommunitySelfStatus } from "@/hooks/use-community-self-status";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  showInShell?: boolean;
};

const COMMON_NAV_ITEMS: NavItem[] = [
  { href: "/members", label: "メンバー", icon: Users },
  { href: "/match/like", label: "ふたりでGO飯", icon: HeartHandshake, showInShell: false },
  { href: "/availability", label: "日程調整", icon: CalendarDays },
  { href: "/group-meals", label: "みんなでGO飯", icon: UtensilsCrossed },
  { href: "/profile", label: "プロフィール", icon: UserRound }
];
const COMMUNITY_NAV_ITEM: NavItem = {
  href: "/community/join",
  label: "コミュニティ申請",
  icon: Megaphone,
};

type AppShellProps = {
  children: ReactNode;
};

type ShellChromeContextValue = {
  setChromeHidden: (hidden: boolean) => void;
};

const ShellChromeContext = createContext<ShellChromeContextValue | null>(null);

export function useShellChrome() {
  return useContext(ShellChromeContext);
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();
  const { data: communityStatus } = useCommunitySelfStatus(Boolean(user));

  const isAdmin = Boolean(user?.isAdmin || communityStatus?.isAdmin);

  const baseNavItems: NavItem[] = isAdmin
    ? [
        // 管理者だけコミュニティ管理や承認タブを見せる
        ...COMMON_NAV_ITEMS.filter((item) => item.href !== "/availability"),
        COMMUNITY_NAV_ITEM,
        { href: "/admin", label: "承認待ち", icon: ShieldCheck },
      ]
    : COMMON_NAV_ITEMS;

  const navItems = baseNavItems.filter((item) => item.showInShell !== false);

  const mobileNavItems: NavItem[] = navItems;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));
  const [isChromeHidden, setIsChromeHidden] = useState(false);
  const chromeContextValue = useMemo(
    () => ({
      setChromeHidden: setIsChromeHidden
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-soft)] text-[var(--text-muted)]">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg-soft)] text-[var(--text-strong)]">
      <header
        className={cn(
          "app-chrome-top sticky top-0 z-30 border-b border-[var(--border)] bg-white/90 backdrop-blur",
          isChromeHidden && "hidden"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-[var(--text-strong)]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--card-muted)] text-[var(--brand-strong)]">
              🍚
            </span>
            <span>
              GO<span className="text-[var(--brand-strong)]">飯</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 text-sm md:flex">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-3 py-2 font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--card-muted)] hover:text-[var(--text-strong)]",
                  isActive(href) && "bg-[var(--brand)] text-white shadow-sm"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            {user ? <span className="hidden text-sm text-[var(--text-muted)] sm:block">{user.name}</span> : null}
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => logout?.()}>
                ログアウト
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">ログイン</Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/admin/login">管理者</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ShellChromeContext.Provider value={chromeContextValue}>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-8 pb-16 md:pb-14">{children}</main>
      </ShellChromeContext.Provider>

      <nav
        className={cn(
          "app-chrome-bottom fixed inset-x-3 bottom-3 z-30 mx-auto max-w-xl rounded-3xl border border-[var(--border)] bg-white/95 shadow-lg backdrop-blur md:hidden",
          isChromeHidden && "hidden"
        )}
      >
        <div className="flex items-center justify-between px-3 py-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-medium transition",
                isActive(href) ? "text-[var(--brand-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              )}
            >
              {Icon ? <Icon className="h-5 w-5" /> : null}
              <span className="whitespace-nowrap">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

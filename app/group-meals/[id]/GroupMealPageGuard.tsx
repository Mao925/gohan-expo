"use client";

import { useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

type GroupMealPageGuardProps = {
  children: React.ReactNode;
};

export function GroupMealPageGuard({ children }: GroupMealPageGuardProps) {
  const { token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = useMemo(() => {
    const basePath = pathname ?? "/";
    const queryString = searchParams?.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      const redirectParam = encodeURIComponent(currentPath);
      router.replace(`/login?redirect=${redirectParam}`);
    }
  }, [currentPath, isLoading, router, token]);

  if (isLoading || !token) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <Card className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
          <p className="mt-3 text-sm text-slate-500">
            ログイン状態を確認しています…
          </p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

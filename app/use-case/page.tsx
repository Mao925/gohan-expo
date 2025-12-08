"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useRouter, useSearchParams } from "next/navigation";

export default function UseCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const handleBack = useCallback(() => {
    if (from) {
      router.push(from);
      return;
    }
    void router.back();
  }, [from, router]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-sm font-medium text-muted-foreground">GO飯の使い方</h1>
        <Button
          onClick={handleBack}
          className="h-12 rounded-full font-bold shadow-md hover:shadow-lg active:scale-95"
        >
          戻る
        </Button>
      </header>
      <div className="flex-1 overflow-y-auto">
        <OnboardingFlow mode="use-case" />
      </div>
    </div>
  );
}

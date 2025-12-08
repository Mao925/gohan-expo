"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");

  const handleCompleted = useCallback(() => {
    const nextPath = inviteToken
      ? `/community/join?inviteToken=${encodeURIComponent(inviteToken)}`
      : "/community/join";
    router.push(nextPath);
  }, [inviteToken, router]);

  return <OnboardingFlow inviteToken={inviteToken} onCompleted={handleCompleted} />;
}

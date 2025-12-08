"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Onboarding1 } from "@/app/onboarding/Onboarding1";
import { Onboarding2 } from "@/app/onboarding/Onboarding2";
import { Onboarding3 } from "@/app/onboarding/Onboarding3";
import { Onboarding4 } from "@/app/onboarding/Onboarding4";
import { Onboarding5 } from "@/app/onboarding/Onboarding5";

const TOTAL_STEPS = 5;

type OnboardingFlowProps = {
  mode?: "default" | "use-case";
  inviteToken?: string | null;
  onBackFromFirstStep?: () => void;
  onCompleted?: () => void;
};

export function OnboardingFlow({
  mode = "default",
  inviteToken,
  onBackFromFirstStep,
  onCompleted,
}: OnboardingFlowProps) {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  const registerPath = useMemo(() => {
    if (!inviteToken) {
      return "/register";
    }
    return `/register?inviteToken=${encodeURIComponent(inviteToken)}`;
  }, [inviteToken]);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      if (onBackFromFirstStep) {
        onBackFromFirstStep();
        return;
      }
      if (mode === "default") {
        router.push(registerPath);
      }
      return;
    }
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, [currentStep, mode, onBackFromFirstStep, registerPath, router]);

  const markOnboardingCompleted = useCallback(async () => {
    await apiFetch("/api/users/me/onboarding-completed", { method: "PATCH" });
    await refreshUser();
  }, [refreshUser]);

  const handleStart = useCallback(async () => {
    try {
      await markOnboardingCompleted();
    } catch (error) {
      console.error("Failed to mark onboarding as completed", error);
    }
    onCompleted?.();
  }, [markOnboardingCompleted, onCompleted]);

  const stepProps = { currentStep, totalSteps: TOTAL_STEPS };

  switch (currentStep) {
    case 0:
      return <Onboarding1 onNext={handleNext} onBack={handleBack} {...stepProps} />;
    case 1:
      return <Onboarding2 onNext={handleNext} onBack={handleBack} {...stepProps} />;
    case 2:
      return <Onboarding3 onNext={handleNext} onBack={handleBack} {...stepProps} />;
    case 3:
      return <Onboarding4 onNext={handleNext} onBack={handleBack} {...stepProps} />;
    case 4:
    default:
      return <Onboarding5 onStart={handleStart} onBack={handleBack} {...stepProps} />;
  }
}

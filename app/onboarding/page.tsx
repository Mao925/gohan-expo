"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Onboarding1 } from "./Onboarding1";
import { Onboarding2 } from "./Onboarding2";
import { Onboarding3 } from "./Onboarding3";
import { Onboarding4 } from "./Onboarding4";
import { Onboarding5 } from "./Onboarding5";

const TOTAL_STEPS = 5;

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");

  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1));
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 0) {
      const registerPath = inviteToken
        ? `/register?inviteToken=${encodeURIComponent(inviteToken)}`
        : "/register";
      router.push(registerPath);
      return;
    }
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, [currentStep, inviteToken, router]);

  const handleStart = useCallback(() => {
    const nextPath = inviteToken
      ? `/community/join?inviteToken=${encodeURIComponent(inviteToken)}`
      : "/community/join";
    router.push(nextPath);
  }, [inviteToken, router]);

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

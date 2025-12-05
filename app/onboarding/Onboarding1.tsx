"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import OnboardingIndicators from "./OnboardingIndicators";
import onboarding1 from "./onboarding-1.png";

interface Onboarding1Props {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function Onboarding1({
  onNext,
  onBack: _onBack,
  currentStep,
  totalSteps,
}: Onboarding1Props) {
  return (
    <div className="h-screen bg-background flex flex-col items-center px-6 pt-10 pb-6 lg:p-10 overflow-hidden">
      <div className="flex-1 flex w-full items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-[32px] shadow-lg px-6 py-6 lg:px-10 lg:py-10 text-center flex flex-col items-center gap-6">
            <div className="flex justify-center">
              <div className="rounded-3xl bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)] p-4">
                <Image
                  src={onboarding1}
                  alt="GO飯アイコン"
                  className="w-[150px] h-[150px] md:w-[200px] md:h-[200px] object-contain"
                />
              </div>
            </div>

            <h2 className="text-3xl leading-relaxed lg:text-4xl text-primary font-bold">
              その「また今度」を、
              <br />
              今日にする。
            </h2>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-6">
        <OnboardingIndicators
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
        <Button
          onClick={onNext}
          className="mt-2 w-full h-12 rounded-full text-base font-bold shadow-md hover:shadow-lg active:scale-95"
        >
          次へ
        </Button>
      </div>
    </div>
  );
}

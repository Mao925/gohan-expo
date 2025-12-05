"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import OnboardingIndicators from "./OnboardingIndicators";
import onboarding2 from "./onboarding-2.png";

interface Onboarding2Props {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function Onboarding2({
  onNext,
  onBack,
  currentStep,
  totalSteps,
}: Onboarding2Props) {
  return (
    <div className="h-screen bg-background flex flex-col items-center px-6 pt-10 pb-6 lg:p-10 overflow-hidden">
      <div className="flex-1 flex w-full items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-[32px] shadow-lg px-6 py-6 lg:px-10 lg:py-10 text-center flex flex-col items-center gap-6">
            <div>
              <h2 className="text-3xl lg:text-4xl text-primary mb-4 font-bold leading-relaxed">
                サシ飲み未満、
                <br />
                大人数以上。
                <br />
                「魔法の４人席」
              </h2>
              <p className="text-base sm:text-lg text-card-foreground leading-relaxed">
                気まずくならず、深い話ができる。
                <br />
                完璧なバランスの食卓を自動で作ります。
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden flex justify-center items-center">
              <Image
                src={onboarding2}
                alt="魔法の4人席"
                className="w-full max-w-md object-contain h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-6">
        <OnboardingIndicators currentStep={currentStep} totalSteps={totalSteps} />
        <div className="mt-2 flex gap-3">
          <Button
            variant="ghost"
            onClick={onBack}
            className="flex-1 h-12 rounded-full font-medium bg-white border border-primary text-primary"
          >
            戻る
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 h-12 rounded-full font-bold shadow-md hover:shadow-lg active:scale-95"
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}

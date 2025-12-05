"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import OnboardingIndicators from "./OnboardingIndicators";
import onboarding4 from "./onboarding-4.png";

interface Onboarding4Props {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function Onboarding4({
  onNext,
  onBack,
  currentStep,
  totalSteps,
}: Onboarding4Props) {
  return (
    <div className="h-screen bg-background flex flex-col items-center px-6 pt-10 pb-6 lg:p-10 overflow-hidden lg:overflow-visible">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-[32px] shadow-lg px-6 py-6 lg:px-10 lg:py-10 flex flex-col items-center gap-6">
          <div className="text-center space-y-3">
            <h2 className="text-3xl lg:text-4xl text-primary font-bold leading-relaxed">
              あとは勝手に
              <br />
              セッティング
            </h2>
            <p className="text-base sm:text-lg text-card-foreground leading-relaxed">
              メンバー集めも、日程調整も、最初の一声も。
              <br />
              面倒なことは全部「GO飯」がやります。
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-md w-full flex justify-center items-center">
            <Image
              src={onboarding4}
              alt="リラックスしたラウンジ"
              className="w-full max-w-md h-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-6 lg:mt-8">
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
            className="flex-1 h-12 rounded-full font-bold shadow-md hover:shadow-lg active:scale-98"
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
}

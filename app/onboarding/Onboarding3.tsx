"use client";

import Image from "next/image";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingIndicators from "./OnboardingIndicators";
import onboarding3 from "./onboarding-3.png";

interface Onboarding3Props {
  onNext: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function Onboarding3({
  onNext,
  onBack,
  currentStep,
  totalSteps,
}: Onboarding3Props) {
  return (
    <div className="h-screen bg-background flex flex-col items-center px-6 pt-10 pb-6 lg:p-10 overflow-hidden">
      <div className="flex-1 flex w-full items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-[32px] shadow-lg px-6 py-6 lg:px-10 lg:py-10 text-center flex flex-col items-center gap-6">
            <div>
              <h2 className="text-3xl lg:text-4xl text-primary mb-4 font-bold leading-relaxed">
                「誰かと行きたい」
                <br />
                と念じるだけ
              </h2>
              <p className="text-base sm:text-lg text-card-foreground leading-relaxed">
                気になる人に、こっそり「いいね」を送ってください。
                <br />
                これが招待状を受け取るための唯一の合図です。
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden flex justify-center items-center w-full">
              <Image
                src={onboarding3}
                alt="食事を楽しむイラスト"
                className="w-full max-w-xs object-contain h-auto"
              />
            </div>

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center shadow-md">
                <Heart className="w-8 h-8 text-primary fill-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mt-6">
        <OnboardingIndicators
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
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

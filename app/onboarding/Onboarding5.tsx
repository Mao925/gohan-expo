"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import OnboardingIndicators from "./OnboardingIndicators";
import onboarding5 from "./onboarding-5.png";

interface Onboarding5Props {
  onStart: () => void;
  onBack: () => void;
  currentStep: number;
  totalSteps: number;
}

export function Onboarding5({
  onStart,
  onBack,
  currentStep,
  totalSteps,
}: Onboarding5Props) {
  return (
    <div className="h-screen bg-background flex flex-col items-center px-6 pt-10 pb-6 lg:p-10 overflow-hidden">
      <div className="flex-1 flex w-full items-center justify-center">
        <div className="w-full max-w-2xl">
          <div className="bg-card rounded-[32px] shadow-lg px-6 py-6 lg:px-10 lg:py-10 flex flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-4xl text-primary font-bold leading-relaxed">
                さあ、メンバーを
                <br />
                見に行こう。
              </h2>
              <p className="text-base sm:text-lg text-card-foreground leading-relaxed">
                まずは掲示板に参加して、
                <br />
                気になる人を探してみましょう。
              </p>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-md w-full">
              <Image
                src={onboarding5}
                alt="ようこそ"
                className="w-full h-[180px] md:h-[220px] object-cover"
              />
            </div>

            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-lg">
                <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-primary" />
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
            onClick={onStart}
            className="flex-1 h-12 rounded-full font-bold shadow-md hover:shadow-lg active:scale-98"
          >
            GO飯をはじめる
          </Button>
        </div>
      </div>
    </div>
  );
}

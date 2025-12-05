"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";
import {
  CalendarHeart,
  Clock3,
  Heart,
  HeartHandshake,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";

type Slide = {
  title: string;
  description: string[];
  icon: ComponentType<{ className?: string }>;
  accent?: string;
  visual?: ReactNode;
};

const slides: Slide[] = [
  {
    title: "GO飯",
    description: ["ワンタップでご飯の約束を始めよう。"],
    icon: UtensilsCrossed,
  },
  {
    title: "ふたりでGO飯",
    description: [
      "もっと仲良くなりたい時に",
      "相手も、実はそう思っているかもしれません。",
    ],
    icon: HeartHandshake,
    accent: "bg-rose-50 text-rose-600",
    visual: (
      <div className="flex h-full w-full max-w-sm flex-col items-center justify-center gap-6">
        <div className="flex items-center justify-center gap-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <UsersRound className="h-8 w-8" />
            <Heart className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 text-rose-500" />
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-600 shadow-sm">
            <CalendarHeart className="h-6 w-6" />
          </div>
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <UsersRound className="h-8 w-8" />
            <Heart className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 text-rose-500" />
          </div>
        </div>
        <Heart className="h-5 w-5 text-rose-500" />
      </div>
    ),
  },
  {
    title: "みんなでGO飯",
    description: [
      "箱を作ってメンバーを招待。",
      "予定も一目でわかるから集合がスムーズ。",
    ],
    icon: UsersRound,
    accent: "bg-rose-50 text-rose-600",
    visual: (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 text-rose-600">
        <div className="flex items-center justify-center gap-4 text-rose-500">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
            <UsersRound className="h-6 w-6" />
          </div>
          <Heart className="h-5 w-5 text-rose-400" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <UsersRound className="h-6 w-6" />
          </div>
          <Heart className="h-5 w-5 text-rose-400" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <UsersRound className="h-6 w-6" />
          </div>
        </div>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const { token } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentSlide = slides[currentIndex];
  const isLast = currentIndex === slides.length - 1;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    if (isLast) {
      const nextPath = inviteToken
        ? `/community/join?inviteToken=${encodeURIComponent(inviteToken)}`
        : "/community/join";

      router.push(nextPath);
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, slides.length - 1));
  };

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-start justify-center bg-[#fff7f0] px-4 py-6 md:min-h-[calc(100vh-96px)] md:items-center md:py-10">
        <Card className="w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold text-slate-900">
            まずは新規登録またはログイン
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            オンボーディングを進めるには、アカウントへのログインが必要です。
          </p>
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-center">
            <Button
              asChild
              className="md:min-w-[140px]"
              aria-label="新規登録ページへ"
            >
              <Link
                href={
                  inviteToken
                    ? `/register?inviteToken=${encodeURIComponent(inviteToken)}`
                    : "/register"
                }
              >
                新規登録へ
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="md:min-w-[140px]"
              aria-label="ログインページへ"
            >
              <Link
                href={
                  inviteToken
                    ? `/login?inviteToken=${encodeURIComponent(inviteToken)}`
                    : "/login"
                }
              >
                ログインへ
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-start justify-center bg-[#fff7f0] px-4 py-6 md:min-h-[calc(100vh-96px)] md:items-center md:py-10">
      <Card className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 md:p-8">
        <div className="flex flex-col items-center gap-6 text-center md:gap-8">
          {currentSlide.title ? (
            <h1 className="text-2xl font-semibold text-slate-900 md:text-3xl">
              {currentSlide.title}
            </h1>
          ) : null}

          <div
            className="relative flex w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl bg-slate-50 md:max-w-2xl"
            style={{ aspectRatio: "3 / 2" }}
          >
            {currentSlide.visual ? (
              currentSlide.visual
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full ${
                    currentSlide.accent ?? "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <currentSlide.icon className="h-8 w-8" />
                </div>
              </div>
            )}
          </div>

          {currentSlide.description.length ? (
            <div className="space-y-2">
              {currentSlide.description.map((line, index) => (
                <p key={index} className="text-sm text-slate-600 md:text-base">
                  {line}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-center gap-2">
            {slides.map((_, index) => {
              const isActive = index === currentIndex;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition ${
                    isActive
                      ? "bg-emerald-400"
                      : "bg-emerald-200 hover:bg-emerald-300"
                  }`}
                  aria-label={`スライド${index + 1}へ移動`}
                />
              );
            })}
          </div>

          <div className="flex w-full items-center justify-between pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              aria-label="前のスライドへ戻る"
            >
              <ChevronLeft className="h-5 w-5" />
              戻る
            </Button>

            <Button
              type="button"
              onClick={handleNext}
              aria-label={
                isLast ? "コミュニティ申請へ進む" : "次のスライドへ進む"
              }
            >
              {isLast ? "コミュニティ申請へ" : "次へ"}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

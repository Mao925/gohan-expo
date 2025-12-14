'use client';

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { RegisterCard } from "@/components/auth/register-card";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  const [error] = useState<string | null>(null);

  const handleLineRegister = () => {
    // 1つ目と同じ「登録後に進む先」
    const nextPath = inviteToken
      ? `/onboarding?inviteToken=${encodeURIComponent(inviteToken)}`
      : "/onboarding";

    // LINEログイン（registerモード）で登録開始
    const url = new URL("/api/auth/line/login", API_BASE_URL);
    url.searchParams.set("mode", "register");

    // OAuth後の戻り先を onboarding に固定（1つ目の挙動に合わせる）
    url.searchParams.set("redirect", nextPath);

    window.location.href = url.toString();
  };

  return (
    <RegisterCard
      description="まずは基本情報を登録しましょう。"
      error={error}
      onLineRegister={handleLineRegister}
    />
  );
}

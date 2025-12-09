"use client";

import type { MouseEvent } from "react";

type Platform = "ios" | "android" | "other";

interface LineOpenInBrowserScreenProps {
  platform: Platform;
  currentUrl: string;
  onContinue?: () => void;
}

export function LineOpenInBrowserScreen({
  platform,
  currentUrl,
  onContinue
}: LineOpenInBrowserScreenProps) {
  const ctaLabel = platform === "ios" ? "Safariで開く" : "ブラウザで開く";
  const browserLabel = platform === "ios" ? "Safari" : "ブラウザ";

  const externalUrl =
    currentUrl ||
    (typeof window !== "undefined" ? window.location.href : "/");

  const handleOpenExternal = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!externalUrl || typeof window === "undefined") {
      return;
    }

    const openedWindow = window.open(externalUrl, "_blank", "noopener,noreferrer");
    if (!openedWindow) {
      window.location.href = externalUrl;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          より快適にご利用いただくために
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          外部ブラウザで開き直してください
        </h1>
        <div className="space-y-2 text-sm text-slate-600 leading-relaxed">
          <p>このページは現在 LINE のブラウザで開かれています。</p>
          <p>
            ログインが切れやすくなったり、パスワードの自動入力がうまく動かないことがあります。
          </p>
          <p>
            {browserLabel}で開き直すと、より安全で快適にご利用いただけます。
          </p>
        </div>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpenExternal}
          className="w-full mt-4 block rounded-xl py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900 text-center"
        >
          {ctaLabel}
        </a>
        {onContinue && (
          <div className="mt-2 text-center">
            <button
              type="button"
              className="text-xs text-slate-500 underline"
              onClick={onContinue}
            >
              それでもこのまま続ける
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

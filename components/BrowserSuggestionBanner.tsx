"use client";

import { useEffect, useState } from "react";
import { useBrowserContext } from "@/hooks/use-browser-context";

const STORAGE_KEY = "hideBrowserSuggestion";

export function BrowserSuggestionBanner() {
  const { data, isLoading, isError } = useBrowserContext();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    if (stored === "1") {
      setIsDismissed(true);
    }
  }, []);

  if (isLoading || isError) {
    return null;
  }

  if (!data?.suggestExternalBrowser || isDismissed) {
    return null;
  }

  const handleClose = () => {
    setIsDismissed(true);
    window.sessionStorage.setItem(STORAGE_KEY, "1");
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] px-4 pb-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1">
          <p className="font-semibold text-[var(--text-strong)]">
            LINEのブラウザではGO飯の一部機能が正しく動かないことがあります。
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            右上のメニューから「Safariで開く」または「Chromeで開く」を選ぶと、より安定して使えます。
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="self-start rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}

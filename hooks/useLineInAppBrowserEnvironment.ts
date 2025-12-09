import { useEffect, useState } from "react";

type Platform = "ios" | "android" | "other";

export function useLineInAppBrowserEnvironment() {
  const [isClient, setIsClient] = useState(false);
  const [isLineInAppBrowser, setIsLineInAppBrowser] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (typeof window === "undefined") {
      return;
    }

    const ua = window.navigator.userAgent || "";
    const uaLower = ua.toLowerCase();

    const isLine = uaLower.includes(" line/") || uaLower.includes(" line ");
    const isIos = /iphone|ipad|ipod/.test(uaLower);
    const isAndroid = /android/.test(uaLower);

    setIsLineInAppBrowser(isLine);
    setPlatform(isIos ? "ios" : isAndroid ? "android" : "other");
    setCurrentUrl(window.location.href);
  }, []);

  return { isClient, isLineInAppBrowser, platform, currentUrl };
}

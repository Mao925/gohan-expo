export type BrowserContext = {
  suggestExternalBrowser: boolean;
  isLineInAppBrowser?: boolean;
  userAgent?: string;
};

export async function fetchBrowserContext(): Promise<BrowserContext> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
  const response = await fetch(`${normalizedBaseUrl}/api/browser-context`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to fetch browser context");
  }

  return (await response.json()) as BrowserContext;
}

'use client';

import { useQuery } from '@tanstack/react-query';
import { BrowserContext, fetchBrowserContext } from '@/lib/api/browserContext';

export function useBrowserContext() {
  return useQuery<BrowserContext>({
    queryKey: ['browserContext'],
    queryFn: fetchBrowserContext,
    staleTime: Infinity,
    cacheTime: Infinity
  });
}

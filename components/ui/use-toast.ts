'use client';

import { useCallback } from 'react';

export type ToastOptions = {
  title: string;
  description?: string;
};

export function useToast() {
  const toast = useCallback(({ title, description }: ToastOptions) => {
    if (typeof window !== 'undefined') {
      console.info('toast:', title, description ?? '');
    }
    // Fallback alert for visibility in absence of a real toast system.
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('gohan-expo-toast', {
          detail: { title, description }
        })
      );
    }
  }, []);

  return { toast };
}

'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  message?: string | null;
  className?: string;
}

export function ErrorBanner({ message, className }: Props) {
  if (!message) return null;
  return (
    <div
      className={cn(
        'mx-auto mb-5 flex w-full max-w-2xl items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:px-5 sm:py-3.5 sm:text-base',
        'justify-center text-center',
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
      <span className="leading-tight sm:leading-normal">{message}</span>
    </div>
  );
}

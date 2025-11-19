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
    <div className={cn('mb-4 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700', className)}>
      <AlertTriangle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

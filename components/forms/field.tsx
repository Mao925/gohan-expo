'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, error, hint, children, className }: FieldProps) {
  return (
    <label className={cn('flex flex-col gap-2 text-sm text-slate-500', className)}>
      <span className="text-base font-medium text-slate-900">{label}</span>
      {children}
      {error ? <span className="text-sm text-red-500">{error}</span> : hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

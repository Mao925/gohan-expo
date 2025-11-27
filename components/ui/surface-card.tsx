'use client';

import { cn } from '@/lib/utils';

type SurfaceCardProps = React.HTMLAttributes<HTMLDivElement> & {
  muted?: boolean;
};

export function SurfaceCard({ className, muted, ...props }: SurfaceCardProps) {
  return (
    <div
      {...props}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-card',
        muted && 'bg-[var(--card-muted)]',
        className
      )}
    />
  );
}

"use client";

import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LikeStatus } from '@/lib/types';

type LikeToggleButtonProps = {
  status: LikeStatus;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export function LikeToggleButton({ status, onClick, disabled, isLoading }: LikeToggleButtonProps) {
  const isYes = status === 'YES';

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full border-0 bg-transparent p-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none',
        isYes ? 'text-red-600 focus-visible:ring-red-400' : 'text-slate-400 focus-visible:ring-slate-300'
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin text-current" />
      ) : (
        <>
          <Heart className="h-5 w-5 transition-colors duration-200" fill={isYes ? 'currentColor' : 'none'} />
          <span className="sr-only">{isYes ? 'いいねを外す' : 'いいねする'}</span>
        </>
      )}
    </button>
  );
}

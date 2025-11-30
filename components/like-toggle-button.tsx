"use client";

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LikeToggleStatus = 'YES' | 'NO' | 'NONE';

type LikeToggleButtonProps = {
  status: LikeToggleStatus;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
};

export function LikeToggleButton({ status, onClick, disabled, isLoading }: LikeToggleButtonProps) {
  const isYes = status === 'YES';

  const handleClick = () => {
    if (disabled || isLoading) return;
    onClick?.();
  };

  return (
    <Button
      type="button"
      size="sm"
      className={cn(
        'min-w-[72px] rounded-full px-4 py-1 text-xs font-semibold shadow-sm transition',
        isYes ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      )}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : isYes ? 'YES' : 'NO'}
    </Button>
  );
}

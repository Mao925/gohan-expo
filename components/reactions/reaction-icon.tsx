"use client";

import { Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReactionType = "heart" | "star";

type ReactionIconProps = {
  type: ReactionType;
  filled?: boolean;
  className?: string;
};

const iconSizeClass = "h-6 w-6 transition-colors duration-200";

const ICON_COLOR_MAP: Record<
  ReactionType,
  { filled: string; default: string }
> = {
  heart: {
    filled: "text-red-600",
    default: "text-slate-400",
  },
  star: {
    filled: "text-yellow-500",
    default: "text-slate-400",
  },
};

export function ReactionIcon({ type, filled = false, className }: ReactionIconProps) {
  const Icon = type === "heart" ? Heart : Star;
  const colorClass = filled ? ICON_COLOR_MAP[type].filled : ICON_COLOR_MAP[type].default;

  return (
    <Icon
      className={cn(iconSizeClass, colorClass, className)}
      fill={filled ? "currentColor" : "none"}
      aria-hidden="true"
    />
  );
}

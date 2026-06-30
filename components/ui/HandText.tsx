"use client";

// HandText — Caveat font wrapper for chalk/handwriting annotations.
// Sizes: sm (14px), md (20px), lg (28px).
// Rotation is clamped to ±5 degrees.
// Add max-sm:hidden on the wrapper span for margin notes that should hide on mobile.

import { cn } from "@/lib/utils/cn";
import { CSSProperties } from "react";

const SIZE_MAP = {
  sm: "0.875rem", // 14px
  md: "1.25rem",  // 20px
  lg: "1.75rem",  // 28px
};

interface HandTextProps {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Clamped to ±5. Default 0. */
  rotate?: number;
  color?: string;
  weight?: 400 | 600;
  className?: string;
  style?: CSSProperties;
}

export function HandText({
  children,
  size     = "md",
  rotate   = 0,
  color    = "currentColor",
  weight   = 400,
  className,
  style,
}: HandTextProps) {
  const clampedRotate = Math.min(5, Math.max(-5, rotate));

  return (
    <span
      className={cn("inline-block whitespace-nowrap", className)}
      style={{
        fontFamily:  "var(--font-caveat, 'Caveat', cursive)",
        fontSize:    SIZE_MAP[size],
        fontWeight:  weight,
        color,
        transform:   clampedRotate !== 0 ? `rotate(${clampedRotate}deg)` : undefined,
        lineHeight:  1.2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

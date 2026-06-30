"use client";

import { useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useSoundStore } from "@/lib/store/sound";
import { useSound } from "@/components/sound/SoundProvider";

const SIZE_PX  = { sm: 32, md: 48, lg: 64 } as const;
const FONT_PX  = { sm: 8,  md: 13, lg: 17 } as const;

// 12-peak bottle-cap crown in a 100×100 viewBox.
// Peaks alternate between outer radius 45 and inner radius 38.
function buildCapPath(): string {
  const peaks = 12;
  const outerR = 45;
  const innerR = 38;
  const pts: string[] = [];
  for (let i = 0; i < peaks * 2; i++) {
    const angle = (i * Math.PI) / peaks - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push(
      `${(50 + r * Math.cos(angle)).toFixed(3)},${(50 + r * Math.sin(angle)).toFixed(3)}`
    );
  }
  return `M ${pts.join(" L ")} Z`;
}

const CAP_PATH = buildCapPath();

export interface BottleCapProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  soundOnHover?: boolean;
  /** Custom aria-label — defaults to "Size {label}, {state}" */
  ariaLabel?: string;
  /** Controlled tabIndex for radiogroup keyboard nav */
  tabIndex?: number;
}

export function BottleCap({
  label,
  active = false,
  disabled = false,
  onClick,
  size = "md",
  soundOnHover = true,
  ariaLabel,
  tabIndex,
}: BottleCapProps) {
  const { muted } = useSoundStore();
  const { play } = useSound();
  const prefersReducedMotion = useReducedMotion();
  const lastHoverAt = useRef(0);

  const px = SIZE_PX[size];
  // Pad smaller sizes to hit WCAG 44 × 44px tap target
  const hitPad = Math.max(0, (44 - px) / 2);

  const onHoverStart = useCallback(() => {
    if (disabled || !soundOnHover || muted) return;
    const now = Date.now();
    if (now - lastHoverAt.current < 500) return;
    lastHoverAt.current = now;
    play("cap");
  }, [disabled, soundOnHover, muted, play]);

  const handleClick = useCallback(() => {
    if (disabled) return;
    if (!muted) {
      play("cap");
      // Going active → layer a clink on top
      if (!active) play("clink");
    }
    onClick?.();
  }, [disabled, muted, active, play, onClick]);

  const reducedMotion   = !!prefersReducedMotion;
  const targetRotation  = reducedMotion ? 0 : active ? 30 : 0;
  const hoverRotation   = reducedMotion || disabled ? undefined : { rotate: active ? 30 : 15 };

  const fill     = active ? "#004AAD" : "#141518";
  const textFill = "#E4E2DD";
  // 1 CSS-px border regardless of svg scale: 100 ÷ rendered-px
  const strokeW  = (100 / px).toFixed(2);

  const defaultAriaLabel = `Size ${label.toUpperCase()}, ${active ? "active" : "inactive"}${disabled ? ", disabled" : ""}`;

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={ariaLabel ?? defaultAriaLabel}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={handleClick}
      onHoverStart={onHoverStart}
      animate={{ rotate: targetRotation }}
      whileHover={hoverRotation}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[--blue] focus-visible:ring-offset-2"
      style={{
        padding:    hitPad > 0 ? hitPad : undefined,
        cursor:     disabled ? "not-allowed" : "pointer",
        filter:     disabled ? "grayscale(1)" : "none",
        opacity:    disabled ? 0.4 : 1,
        background: "none",
        border:     "none",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={px}
        height={px}
        aria-hidden="true"
        style={{ display: "block", overflow: "visible" }}
      >
        <path
          d={CAP_PATH}
          fill={fill}
          stroke="#141518"
          strokeWidth={strokeW}
          strokeLinejoin="round"
        />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fill={textFill}
          fontFamily="'JetBrains Mono', monospace"
          fontWeight="500"
          fontSize={FONT_PX[size]}
          style={{ userSelect: "none" }}
        >
          {label.toUpperCase()}
        </text>
      </svg>
    </motion.button>
  );
}

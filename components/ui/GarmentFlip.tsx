"use client";

// GarmentFlip — cross-fade between front and back garment views.
// Desktop (hover device): mouseenter → back, mouseleave → front.
// Mobile / touch: tap-toggle pill bottom-right.
// Keyboard: focus shows the toggle pill; Enter/Space activates it.
// prefers-reduced-motion: instant swap, no cross-fade.
// If `back` is null: static front, no interaction attached.

import { useMediaQuery } from "@/lib/theka/hooks";
import { useState, useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface GarmentFlipProps {
  front: ReactNode;
  back: ReactNode | null;
  alt: string;
  className?: string;
}

export function GarmentFlip({ front, back, alt, className }: GarmentFlipProps) {
  const shouldReduceMotion = useReducedMotion();
  const dur = shouldReduceMotion ? 0 : 0.28;

  const isHoverDevice = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [showBack,      setShowBack]      = useState(false);
  const [isHovered,     setIsHovered]     = useState(false);
  const [isFocused,     setIsFocused]     = useState(false);

  // Static — no interaction
  if (!back) {
    return (
      <div
        className={cn("relative w-full h-full", className)}
        aria-label={`${alt}, showing front`}
      >
        {front}
      </div>
    );
  }

  const showTogglePill = (!isHoverDevice || isFocused) && back;

  const handleMouseEnter = () => {
    if (!isHoverDevice) return;
    setIsHovered(true);
    setShowBack(true);
  };

  const handleMouseLeave = () => {
    if (!isHoverDevice) return;
    setIsHovered(false);
    setShowBack(false);
  };

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowBack((v) => !v);
  };

  return (
    <div
      className={cn("relative w-full h-full", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={`${alt}, showing ${showBack ? "back" : "front"}`}
    >
      {/* Front layer */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: showBack ? 0 : 1,
          scale:   showBack ? 0.98 : 1,
        }}
        transition={{ duration: dur, ease: "easeInOut" }}
        aria-hidden={showBack}
      >
        {front}
      </motion.div>

      {/* Back layer */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: showBack ? 1 : 0,
          scale:   showBack ? 1 : 1.02,
        }}
        transition={{ duration: dur, ease: "easeInOut" }}
        aria-hidden={!showBack}
      >
        {back}
      </motion.div>

      {/* Desktop hover label — bottom left, while actually hovering */}
      {isHoverDevice && isHovered && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute bottom-2 left-2 z-20 font-mono text-[9px] uppercase tracking-[0.12em] text-(--cream) pointer-events-none select-none"
        >
          {showBack ? "back" : "front"}
        </motion.span>
      )}

      {/* Toggle pill — mobile + keyboard focused users */}
      {showTogglePill && (
        <button
          type="button"
          aria-pressed={showBack}
          aria-label={showBack ? "Show front view" : "See back view"}
          onClick={handleToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleToggle(e);
          }}
          className={cn(
            "absolute bottom-2 right-2 z-20",
            "flex items-center gap-1",
            "font-mono text-[9px] uppercase tracking-[0.1em]",
            "bg-(--cream) text-(--ink) border border-(--ink)/20",
            "px-2 py-1 shadow-sm",
            "transition-opacity duration-150",
            "hover:border-(--ink)/40 active:scale-95"
          )}
        >
          ↻ {showBack ? "see front" : "see back"}
        </button>
      )}
    </div>
  );
}

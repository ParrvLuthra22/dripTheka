"use client";

// STUB — Pint glass cart indicator placeholder
// The animated fill + Lottie version is built in the glasses prompt.
// For now: simple text badge so the nav compiles cleanly.

import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils/cn";

interface PintGlassCartProps {
  className?: string;
}

export function PintGlassCart({ className }: PintGlassCartProps) {
  const { totalItems, toggleCart } = useCartStore();
  const count = totalItems();

  return (
    <button
      onClick={toggleCart}
      aria-label={`What's In Your Glass — ${count} item${count !== 1 ? "s" : ""}`}
      className={cn(
        "relative font-mono text-[10px] uppercase tracking-widest",
        "text-[--ink] hover:text-[--blue] transition-colors duration-200",
        className
      )}
    >
      Glass
      {count > 0 && (
        <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center w-4 h-4 rounded-full bg-[--blue] text-[--cream] text-[8px] font-mono">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

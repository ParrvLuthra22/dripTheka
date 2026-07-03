"use client";

// FabricChip — colour swatch for the product colour selector.
// 56 × 72px chip filled with the garment colour + grain overlay for fabric feel.
// Lifts on hover, cobalt inset ring when active.

import { motion } from "framer-motion";
import { Grain } from "@/components/ui/Grain";
import { cn } from "@/lib/utils/cn";

export interface FabricChipProps {
  color:      string;
  colorName:  string;
  active?:    boolean;
  disabled?:  boolean;
  onClick?:   () => void;
  tabIndex?:  number;
}

export function FabricChip({
  color,
  colorName,
  active   = false,
  disabled = false,
  onClick,
  tabIndex,
}: FabricChipProps) {
  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={active}
      aria-disabled={disabled || undefined}
      aria-label={`${colorName}${active ? ", selected" : ""}${disabled ? ", unavailable" : ""}`}
      disabled={disabled}
      tabIndex={tabIndex}
      onClick={!disabled ? onClick : undefined}
      animate={{ scale: active ? 1.05 : 1 }}
      whileHover={!disabled ? { y: -4 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center gap-1.5 shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue] focus-visible:ring-offset-2",
        disabled ? "opacity-40 grayscale cursor-not-allowed" : "cursor-pointer"
      )}
    >
      {/* Chip rectangle */}
      <motion.div
        className="relative w-14 h-[72px]"
        animate={{
          boxShadow: active
            ? "inset 0 0 0 2px #004AAD, 0 4px 16px rgba(0,74,173,0.22)"
            : "inset 0 0 0 1px rgba(20,21,24,0.28), 0 1px 4px rgba(20,21,24,0.08)",
        }}
        whileHover={!disabled ? { boxShadow: "inset 0 0 0 1px rgba(20,21,24,0.28), 0 8px 20px rgba(20,21,24,0.18)" } : undefined}
        transition={{ duration: 0.2 }}
        style={{ backgroundColor: color }}
      >
        {/* Grain texture gives fabric feel */}
        <Grain opacity={0.07} />
      </motion.div>

      {/* Colour name label */}
      <span
        className={cn(
          "font-mono text-[10px] uppercase tracking-[0.12em]",
          active ? "text-[--blue]" : "text-[--ink]/50"
        )}
      >
        {colorName}
      </span>
    </motion.button>
  );
}

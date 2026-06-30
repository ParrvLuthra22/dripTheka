"use client";

// TextSticker — decorative streetwear text label layer.
//
// Purely cosmetic chaos: rotated peel-stickers, rubber stamps and washi-tape
// strips slapped onto the clean grid for GenZ poster energy. Always
// pointer-events-none + aria-hidden so they never trap clicks or confuse SR.
//
// Variants:
//   slap    — rounded pill, hard offset shadow, like a slapped vinyl sticker
//   stamp   — circular dashed "rubber stamp" (e.g. APPROVED / PAID)
//   tape    — translucent washi-tape strip, skewed
//
// Usage — drop into any `position: relative` container:
//   <TextSticker variant="slap" tone="cream" className="absolute -top-3 right-6" rotate={-8}>
//     no restocks
//   </TextSticker>

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export type StickerVariant = "slap" | "stamp" | "tape";
export type StickerTone    = "neon" | "blue" | "cream" | "ink";

interface StickerProps {
  children: React.ReactNode;
  variant?: StickerVariant;
  tone?: StickerTone;
  /** Resting rotation in degrees. */
  rotate?: number;
  className?: string;
  /** Entrance + wiggle animation. Default true. */
  animate?: boolean;
}

// Hex literals throughout — bare CSS-var arbitrary values like `text-[--neon]`
// are ambiguous in Tailwind v4 (color vs length) and can silently drop.
const toneClasses: Record<StickerTone, string> = {
  neon:  "bg-[#004AAD] text-[#E4E2DD] border-black",
  blue:  "bg-[#004AAD] text-[#E4E2DD] border-black",
  cream: "bg-[#E4E2DD] text-[#141518] border-[#141518]",
  ink:   "bg-[#141518] text-[#E4E2DD] border-black",
};

export function TextSticker({
  children,
  variant = "slap",
  tone    = "neon",
  rotate  = -6,
  className,
  animate = true,
}: StickerProps) {
  const base = "pointer-events-none select-none whitespace-nowrap";

  const variantClasses: Record<StickerVariant, string> = {
    slap: cn(
      "inline-flex items-center justify-center",
      "font-tanker uppercase tracking-tight leading-none",
      "text-[11px] md:text-[13px] px-3 py-1.5",
      "border-2 rounded-full",
      "shadow-[3px_3px_0_0_#141518]",
      toneClasses[tone],
    ),
    stamp: cn(
      "inline-flex items-center justify-center text-center",
      "font-tanker uppercase leading-[0.85] tracking-tight",
      "text-[10px] md:text-[12px] w-20 h-20 md:w-24 md:h-24 rounded-full",
      "border-[3px] border-double",
      "opacity-90",
      tone === "ink" || tone === "blue" || tone === "neon"
        ? cn(toneClasses[tone])
        : cn("bg-transparent", "text-[#141518] border-[#141518]"),
    ),
    tape: cn(
      "inline-flex items-center justify-center",
      "font-mono uppercase tracking-[0.2em]",
      "text-[9px] md:text-[10px] px-4 py-1",
      "backdrop-blur-[1px]",
      tone === "cream" ? "bg-[#E4E2DD]/70 text-[#141518]" :
      tone === "ink"   ? "bg-[#141518]/70 text-[#E4E2DD]" :
                         "bg-[#004AAD]/70 text-[#E4E2DD]",
    ),
  };

  const content = (
    <span className={cn(base, variantClasses[variant], className)} style={{ rotate: `${rotate}deg` }}>
      {children}
    </span>
  );

  if (!animate) {
    return (
      <span aria-hidden="true" className="contents">
        {content}
      </span>
    );
  }

  return (
    <motion.span
      aria-hidden="true"
      className={cn(base, variantClasses[variant], className)}
      style={{ transformOrigin: "center" }}
      initial={{ opacity: 0, scale: 0.4, rotate: rotate - 18 }}
      whileInView={{ opacity: 1, scale: 1, rotate }}
      viewport={{ once: true, margin: "-40px" }}
      whileHover={{ rotate: rotate + 4, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 380, damping: 14 }}
    >
      {children}
    </motion.span>
  );
}

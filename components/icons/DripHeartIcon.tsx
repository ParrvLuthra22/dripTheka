"use client";

// DripHeartIcon — brand "save" icon using the WineGlassMark shape.
// Replaces the generic heart: pour a product into your Khata (wishlist)
// instead of heart-ing it. When filled=true, the glass shows liquid.

import { motion } from "framer-motion";
import { WineGlassMark } from "@/components/glass/WineGlassMark";

interface DripHeartIconProps {
  filled: boolean;
  size?: number;
  className?: string;
}

export function DripHeartIcon({ filled, size = 20, className }: DripHeartIconProps) {
  return (
    <motion.span
      key={filled ? "saved" : "unsaved"}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 16 }}
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <WineGlassMark
        size={size}
        liquid={filled ? 55 : 0}
        liquidColor="var(--blue)"
        color={filled ? "var(--blue)" : "var(--ink)"}
      />
    </motion.span>
  );
}

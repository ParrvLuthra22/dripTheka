"use client";

// PriceTag — hangtag-style price display.
// Sits at a lazy -8deg tilt by default; straightens + grows slightly on hover,
// with the string giving a subtle sway.

import { motion } from "framer-motion";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const SIZES = {
  sm: { w: 64, h: 35 },
  md: { w: 92, h: 50 },
} as const;

const VB_W = 92;
const VB_H = 50;

const tagVariants = {
  rest:  { rotate: -8, scale: 1 },
  hover: { rotate: -2, scale: 1.05 },
};

const stringVariants = {
  rest:  { rotate: 0 },
  hover: { rotate: [0, -6, 4, -2, 0], transition: { duration: 0.6, ease: "easeInOut" as const } },
};

interface PriceTagProps {
  /** Price in paise */
  price: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function PriceTag({ price, label, size = "md", className }: PriceTagProps) {
  const { w, h } = SIZES[size];
  const priceFontSize = label ? 11 : 13;

  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      variants={tagVariants}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformOrigin: "21% 34%" }}
      className={cn("inline-block select-none", className)}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        fill="none"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* String — extends above/left of SVG bounds from knot to punch hole */}
        <motion.g
          variants={stringVariants}
          style={{ transformOrigin: "19px 17px" }}
        >
          {/* Knot at string end */}
          <circle cx="-13" cy="-18" r="2.2" fill="var(--ink)" opacity="0.5" />
          {/* String curve from knot down to punch hole */}
          <path
            d="M -13 -18 C -4 -10 6 0 19 17"
            stroke="var(--ink)"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.55"
          />
        </motion.g>

        {/* Tag body */}
        <rect
          x="9" y="9" width="79" height="37" rx="5"
          fill="var(--cream)"
          stroke="var(--ink)"
          strokeWidth="1.5"
        />

        {/* Punch hole */}
        <circle cx="19" cy="17" r="3" fill="var(--cream)" stroke="var(--ink)" strokeWidth="1.5" />

        {/* Optional label */}
        {label && (
          <text
            x="56" y="22"
            textAnchor="middle"
            fontFamily="var(--font-jetbrains)"
            fontSize="7"
            letterSpacing="1"
            fill="var(--ink)"
            opacity="0.4"
          >
            {label.toUpperCase()}
          </text>
        )}

        {/* Price */}
        <text
          x="56" y={label ? 36 : 31}
          textAnchor="middle"
          fontFamily="var(--font-jetbrains)"
          fontSize={priceFontSize}
          fill="var(--ink)"
        >
          {formatPrice(price)}
        </text>
      </svg>
    </motion.div>
  );
}

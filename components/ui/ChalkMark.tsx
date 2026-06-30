"use client";

// ChalkMark — hand-drawn SVG annotation marks.
//
// Each variant is an imperfect line/shape. A per-instance feTurbulence
// + feDisplacementMap filter adds organic roughness. Framer Motion's
// pathLength 0→1 drives the "draw in" effect on scroll; prefers-reduced-motion
// skips animation and renders immediately.
//
// Usage (inline under a word):
//   <span className="relative inline-block">
//     theka
//     <ChalkMark variant="underline" color="var(--blue)"
//       className="absolute -bottom-1 left-0 w-full h-[9px]" />
//   </span>
//
// Usage (circle around content):
//   <span className="relative inline-block p-1">
//     <SomeLabel />
//     <ChalkMark variant="circle" className="absolute inset-0 w-full h-full" />
//   </span>

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export type ChalkVariant = "underline" | "circle" | "arrow" | "scribble" | "tick" | "asterisk";
export type ArrowDirection = "right" | "left" | "down" | "up";

interface ChalkMarkProps {
  variant: ChalkVariant;
  color?: string;
  strokeWidth?: number;
  /** Draw-in animation on scroll entry. Default true. */
  animate?: boolean;
  /** Arrow direction — only for variant="arrow". Default "right". */
  direction?: ArrowDirection;
  className?: string;
}

type VariantConfig = {
  viewBox: string;
  preserveAspectRatio: string;
  paths: string[];
};

function getConfig(variant: ChalkVariant, direction: ArrowDirection): VariantConfig {
  switch (variant) {
    case "underline":
      return {
        viewBox: "0 0 100 8",
        preserveAspectRatio: "none",
        paths: ["M 0 5 C 12 4 28 7 42 5 C 58 3 72 6 86 4.5 C 92 4 97 6 100 5"],
      };

    case "circle":
      return {
        viewBox: "0 0 100 36",
        preserveAspectRatio: "none",
        paths: [
          "M 94 18 C 93 8 82 2 62 1 C 40 0 16 3 7 12 C 2 17 3 25 9 29 C 20 36 46 38 68 35 C 84 32 96 25 97 19",
        ],
      };

    case "arrow": {
      const arrows: Record<ArrowDirection, VariantConfig> = {
        right: {
          viewBox: "0 0 80 24",
          preserveAspectRatio: "xMidYMid meet",
          paths: ["M 2 12 C 18 10 38 14 62 12", "M 62 12 L 54 5", "M 62 12 L 54 19"],
        },
        left: {
          viewBox: "0 0 80 24",
          preserveAspectRatio: "xMidYMid meet",
          paths: ["M 78 12 C 62 10 42 14 18 12", "M 18 12 L 26 5", "M 18 12 L 26 19"],
        },
        down: {
          viewBox: "0 0 24 80",
          preserveAspectRatio: "xMidYMid meet",
          paths: ["M 12 2 C 10 18 14 38 12 62", "M 12 62 L 5 54", "M 12 62 L 19 54"],
        },
        up: {
          viewBox: "0 0 24 80",
          preserveAspectRatio: "xMidYMid meet",
          paths: ["M 12 78 C 10 62 14 42 12 18", "M 12 18 L 5 26", "M 12 18 L 19 26"],
        },
      };
      return arrows[direction];
    }

    case "scribble":
      return {
        viewBox: "0 0 100 36",
        preserveAspectRatio: "none",
        paths: [
          "M 6 8 L 94 28",
          "M 8 18 L 92 18",
          "M 5 28 L 95 8",
          "M 15 30 L 86 10",
        ],
      };

    case "tick":
      return {
        viewBox: "0 0 48 38",
        preserveAspectRatio: "xMidYMid meet",
        paths: ["M 4 18 C 9 23 16 30 20 34 C 28 20 40 8 46 4"],
      };

    case "asterisk":
      return {
        viewBox: "0 0 30 30",
        preserveAspectRatio: "xMidYMid meet",
        paths: ["M 15 3 L 15 27", "M 4 9 L 26 21", "M 26 9 L 4 21"],
      };
  }
}

export function ChalkMark({
  variant,
  color        = "currentColor",
  strokeWidth  = 2,
  animate      = true,
  direction    = "right",
  className,
}: ChalkMarkProps) {
  const reactId        = useId();
  const uid            = reactId.replace(/:/g, "");
  const filterId       = `cm-${uid}`;
  const prefersReduced = useReducedMotion();
  const shouldAnimate  = animate && !prefersReduced;

  const { viewBox, preserveAspectRatio, paths } = getConfig(variant, direction);

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("overflow-visible", className)}
    >
      <defs>
        <filter
          id={filterId}
          x="-5%"
          y="-25%"
          width="110%"
          height="150%"
          colorInterpolationFilters="linearRGB"
        >
          <feTurbulence type="turbulence" baseFrequency="0.04" numOctaves="2" seed="4" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>

      {paths.map((d, i) =>
        shouldAnimate ? (
          <motion.path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterId})`}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-10px" }}
            transition={{
              pathLength: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
              opacity:    { duration: 0.05, delay: i * 0.1 },
            }}
          />
        ) : (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${filterId})`}
          />
        )
      )}
    </svg>
  );
}

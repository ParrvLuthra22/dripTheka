"use client";

// WineGlassMark — the brand mark. Used everywhere as logo/favicon/watermark.
// SVG only. No WebGL. Silhouette of a Riedel Bordeaux-style glass.
//
// IMPORTANT: This is the WINE GLASS (brand mark).
// The pint glass (cart indicator) lives in PintGlass.tsx. Do not confuse.

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const SIZES = { sm: 24, md: 48, lg: 160 } as const;

interface WineGlassMarkProps {
  className?: string;
  /** Named size or explicit pixel width */
  size?: keyof typeof SIZES | number;
  /** Fill level 0–100. When > 0 renders a cobalt liquid fill inside the bowl. */
  liquid?: number;
  /** Rotation in degrees — for the "Tapped Out" tipped state */
  tilt?: number;
  /** CSS color for the liquid (default: var(--blue)) */
  liquidColor?: string;
  /** Override stroke color (inherits currentColor by default) */
  color?: string;
}

// ── viewBox constants (0 0 100 140) ─────────────────────────────────────────
//
// Riedel Bordeaux profile:
//   Bowl:  y 12 → 94   (tall, wide equator, slightly inward rim)
//   Stem:  y 94 → 122  (very thin — 8px wide)
//   Foot:  y 122 → 133 (flat disc with curved underside)
//
// Right outer bowl control points:
//   (66,12) → C(80,16, 88,40, 86,58) → (86,58) max bowl
//   (86,58) → C(84,75, 70,88, 54,94) → stem join

const VB = {
  rimLeftX:    34,
  rimRightX:   66,
  rimY:        12,
  rimRx:       16,
  rimRy:        4,
  bowlMaxX:    86,   // max bowl width at ~y=58
  bowlMaxY:    58,
  stemJoinY:   94,
  stemRightX:  54,
  stemLeftX:   46,
  stemBottomY: 122,
  footY:       133,
  footRx:      28,
  footRy:        7,

  // Bowl interior bounds (for liquid clip):
  bowlInnerTopY:  12,
  bowlInnerBotY:  94,
};

const OUTER_PATH = [
  `M ${VB.rimLeftX} ${VB.rimY}`,
  `L ${VB.rimRightX} ${VB.rimY}`,         // back of rim (straight — rim ellipse drawn separately)
  "C 80 16 88 40 86 58",                   // right outer — curves out to bowl equator
  "C 84 75 70 88 54 94",                   // right bowl — narrows to stem
  `L ${VB.stemRightX} ${VB.stemBottomY}`, // right stem
  "C 62 124 72 127 78 133",               // right base widens
  `A ${VB.footRx} ${VB.footRy} 0 0 1 22 133`, // base arc (clockwise → slight downward curve)
  "C 28 127 38 124 46 122",               // left base
  `L ${VB.stemLeftX} ${VB.stemJoinY}`,    // left stem
  "C 30 88 16 75 14 58",                  // left bowl → stem
  "C 12 40 20 16 34 12",                  // left outer bowl → rim
  "Z",
].join(" ");

// Slightly inset bowl interior — used as clip path for liquid fill
const INNER_BOWL_PATH = [
  `M 36 ${VB.rimY}`,
  `L 64 ${VB.rimY}`,
  "C 78 16 85 41 83 58",    // right inner
  "C 81 74 68 87 54 94",
  `L 46 ${VB.stemJoinY}`,
  "C 32 87 19 74 17 58",    // left inner
  "C 15 41 22 16 36 12",
  "Z",
].join(" ");

const BOWL_DRAW_H = VB.bowlInnerBotY - VB.bowlInnerTopY; // 82

export function WineGlassMark({
  className,
  size = "md",
  liquid = 0,
  tilt = 0,
  liquidColor = "var(--blue, #004AAD)",
  color,
}: WineGlassMarkProps) {
  const rawId = useId();
  const clipId = `wgm-${rawId.replace(/:/g, "")}`;

  const px = typeof size === "number" ? size : SIZES[size];
  const h  = Math.round(px * 1.4); // viewBox ratio 100:140

  const clamped   = Math.max(0, Math.min(100, liquid));
  const liquidY   = VB.bowlInnerBotY - (clamped / 100) * BOWL_DRAW_H;
  const liquidH   = VB.bowlInnerBotY - liquidY;

  const style: React.CSSProperties = {
    ...(tilt !== 0 && {
      transform:       `rotate(${tilt}deg)`,
      transformOrigin: "50% 68%", // rotate around base for natural tip
    }),
    ...(color && { color }),
  };

  return (
    <svg
      width={px}
      height={h}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("overflow-visible", className)}
      aria-hidden="true"
      style={style}
    >
      <defs>
        {clamped > 0 && (
          <clipPath id={clipId}>
            <path d={INNER_BOWL_PATH} />
          </clipPath>
        )}
      </defs>

      {/* ── Liquid fill ─────────────────────────────────────────────── */}
      {clamped > 0 && (
        <>
          {/* Main fill body */}
          <rect
            x="10"
            y={liquidY}
            width="80"
            height={liquidH}
            fill={liquidColor}
            clipPath={`url(#${clipId})`}
            style={{
              transition: "y 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1)), height 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1))",
            }}
          />
          {/* Meniscus highlight — thin light stripe at liquid surface */}
          <ellipse
            cx="50"
            cy={liquidY}
            rx={Math.max(3, 14 - ((liquidY - VB.rimY) / BOWL_DRAW_H) * 10)}
            ry="2.5"
            fill="rgba(255,255,255,0.18)"
            clipPath={`url(#${clipId})`}
            style={{
              transition: "cy 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1))",
            }}
          />
        </>
      )}

      {/* ── Glass silhouette (stroke, no fill) ──────────────────────── */}
      <path
        d={OUTER_PATH}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* ── Rim ellipse — the glass opening ─────────────────────────── */}
      {/* Front half only (visible arc suggesting depth) */}
      <ellipse
        cx="50"
        cy={VB.rimY}
        rx={VB.rimRx}
        ry={VB.rimRy}
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
    </svg>
  );
}

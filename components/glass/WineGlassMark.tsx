"use client";

// WineGlassMark — the brand's wine glass illustration.
// Redrawn to match the official artwork: tall rounded bowl narrowing slightly
// at the rim, thin straight stem, elliptical base, optional wavy wine inside.
//
// This is NOT the brand logo — that's BrandLogo (uses /public/dtlogo.png).
// This is the wine glass *visual* used as:
//   • Decorative anchors on the story page
//   • Tipped-glass watermark for Tapped Out products (tilt prop)
//   • Fill animation moments (liquid prop)
//   • Pre-checkout cart hero
//
// Inherits `color` via currentColor so it adapts to any text context.

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

const SIZES = { sm: 24, md: 48, lg: 160 } as const;

interface WineGlassMarkProps {
  className?: string;
  size?: keyof typeof SIZES | number;
  /** Liquid fill level 0–100 */
  liquid?: number;
  /** Rotation in degrees — for the "Tapped Out" tipped state */
  tilt?: number;
  /** CSS color for the liquid (default: currentColor at full opacity) */
  liquidColor?: string;
  /** Override stroke color (default: currentColor) */
  color?: string;
}

// ── viewBox 0 0 100 140 ────────────────────────────────────────────────────
//
// Profile redrawn to match the brand artwork:
//   - Bowl: rounded at the bottom, gently narrows toward the rim
//     (Burgundy-style — wider at the equator than the rim)
//   - Stem: thin straight vertical line, no taper
//   - Base: flat oval with the stem sitting on top
//   - Rim: slight inward curl gives a finished feel

const BOWL_BOTTOM_Y = 88;   // where bowl meets stem
const RIM_Y         = 8;    // top of glass
const STEM_BOT_Y    = 122;  // bottom of stem (top of base)
const BASE_Y        = 130;  // base midline
const STEM_X_LEFT   = 47;
const STEM_X_RIGHT  = 53;

// Outer bowl outline — closed shape, drawn clockwise from upper-left rim
const BOWL_OUTLINE = [
  // Start at left rim
  `M 28 ${RIM_Y}`,
  // Across the top (front rim — slight downward arc gives depth)
  `Q 50 14 72 ${RIM_Y}`,
  // Right side of bowl — curves out to equator, then narrows toward stem
  `C 88 ${RIM_Y + 12} 92 38 88 56`,           // upper bowl flare
  `C 84 74 70 ${BOWL_BOTTOM_Y - 4} 53 ${BOWL_BOTTOM_Y}`,  // bowl base right
  // Down the stem (right side)
  `L ${STEM_X_RIGHT} ${STEM_BOT_Y}`,
  // Across to left of stem at base
  `L ${STEM_X_LEFT} ${STEM_BOT_Y}`,
  // Up the stem (left side)
  `L 47 ${BOWL_BOTTOM_Y}`,
  // Left bowl base — mirror of the right
  `C 30 ${BOWL_BOTTOM_Y - 4} 16 74 12 56`,
  `C 8 38 12 ${RIM_Y + 12} 28 ${RIM_Y}`,
  "Z",
].join(" ");

// Inner bowl path — used as a clip path for the liquid fill,
// slightly inset from the outer outline.
const INNER_BOWL = [
  `M 30 10`,
  `Q 50 16 70 10`,
  `C 84 22 88 38 84 56`,
  `C 80 72 68 84 54 86`,
  `L 46 86`,
  `C 32 84 20 72 16 56`,
  `C 12 38 16 22 30 10`,
  "Z",
].join(" ");

const BOWL_INNER_TOP    = 10;
const BOWL_INNER_BOTTOM = 86;
const BOWL_DRAW_H       = BOWL_INNER_BOTTOM - BOWL_INNER_TOP;

export function WineGlassMark({
  className,
  size = "md",
  liquid = 0,
  tilt = 0,
  liquidColor,
  color,
}: WineGlassMarkProps) {
  const rawId    = useId();
  const clipId   = `wgm-${rawId.replace(/:/g, "")}`;
  const waveId   = `wgm-wave-${rawId.replace(/:/g, "")}`;

  const px       = typeof size === "number" ? size : SIZES[size];
  const h        = Math.round(px * 1.4); // 100:140 ratio

  const clamped  = Math.max(0, Math.min(100, liquid));
  const liquidTopY = BOWL_INNER_BOTTOM - (clamped / 100) * BOWL_DRAW_H;
  const liquidH    = BOWL_INNER_BOTTOM - liquidTopY;

  // Wave amplitude — proportional to the bowl width at the liquid level
  // (small at the bottom, larger near the rim where the glass is wider)
  const fillRatio    = clamped / 100;
  const waveAmplitude = 2 + fillRatio * 2; // 2–4px

  // Default liquid color = current text color at full opacity
  const fillColor = liquidColor ?? "currentColor";

  const style: React.CSSProperties = {
    ...(tilt !== 0 && {
      transform:       `rotate(${tilt}deg)`,
      transformOrigin: "50% 92%", // rotate around the foot
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
            <path d={INNER_BOWL} />
          </clipPath>
        )}
        {/* Wavy surface path generator */}
        {clamped > 0 && (
          <pattern id={waveId} x="0" y="0" width="20" height={waveAmplitude * 2} patternUnits="userSpaceOnUse">
            <path
              d={`M 0 ${waveAmplitude} Q 5 0 10 ${waveAmplitude} T 20 ${waveAmplitude}`}
              fill={fillColor}
            />
          </pattern>
        )}
      </defs>

      {/* ── Liquid fill ─────────────────────────────────────────────── */}
      {clamped > 0 && (
        <g clipPath={`url(#${clipId})`}>
          {/* Solid fill body */}
          <rect
            x="0"
            y={liquidTopY}
            width="100"
            height={liquidH}
            fill={fillColor}
            style={{
              transition: "y 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1)), height 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1))",
            }}
          />
          {/* Wavy surface — drawn as a path on top, gives the wine its character */}
          <path
            d={[
              `M 0 ${liquidTopY + waveAmplitude}`,
              `Q 10 ${liquidTopY - waveAmplitude} 22 ${liquidTopY + waveAmplitude / 2}`,
              `T 50 ${liquidTopY}`,
              `T 78 ${liquidTopY + waveAmplitude / 2}`,
              `T 100 ${liquidTopY + waveAmplitude}`,
              `L 100 ${liquidTopY + waveAmplitude + 8}`,
              `L 0 ${liquidTopY + waveAmplitude + 8}`,
              "Z",
            ].join(" ")}
            fill={fillColor}
            style={{
              transition: "all 0.55s var(--ease-pour, cubic-bezier(.6,.05,.2,1))",
            }}
          />
        </g>
      )}

      {/* ── Glass outline (bowl + stem in one closed path) ──────────── */}
      <path
        d={BOWL_OUTLINE}
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Base (elliptical foot) ──────────────────────────────────── */}
      <ellipse
        cx="50"
        cy={BASE_Y}
        rx="20"
        ry="3.5"
        stroke="currentColor"
        strokeWidth="3"
        fill="currentColor"
      />
    </svg>
  );
}

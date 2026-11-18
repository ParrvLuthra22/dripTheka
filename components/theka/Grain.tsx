// Grain — SVG fractal-noise overlay.
//
// Self-contained: every instance carries its own <filter> (id via useId), so
// it works in any tree — no shared <defs> required. The noise is desaturated
// to neutral grey and laid over content with plain opacity.
// NO mix-blend-mode — blending shifted cobalt toward purple on some GPUs and
// broke the solid-colour guarantees in /docs/COLOR_RULES.md.
//
//   <Grain />                 → absolute, fills nearest positioned ancestor
//   <Grain fixed />           → fixed full-viewport page grain (layout uses this)
//   <Grain opacity={0.1} />   → override strength (default: --grain-opacity)

import { useId } from "react";

interface GrainProps {
  /** 0–1. Defaults to the --grain-opacity token. */
  opacity?: number;
  /** Fixed, full-viewport overlay instead of filling the parent. */
  fixed?: boolean;
  className?: string;
}

export function Grain({ opacity, fixed = false, className }: GrainProps) {
  const id = `dt-grain-${useId().replace(/:/g, "")}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
      className={[
        fixed ? "fixed" : "absolute",
        "inset-0 w-full h-full pointer-events-none select-none",
        className,
      ].filter(Boolean).join(" ")}
      style={{
        opacity: opacity ?? "var(--grain-opacity)",
        zIndex:  fixed ? "var(--z-grain)" : undefined,
      }}
    >
      <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        {/* Desaturate → neutral grain that never tints the brand colours */}
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

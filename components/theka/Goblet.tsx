// Goblet — the wine-glass SVG, copied exactly from GOBLET() in
// bar-reference.html. Parameterised by width.
//
// Swap point: callers only pass `width`/`className`, so this can later become
// a desktop-only R3F <Canvas> glass without touching GlassUnit/ServePour.
// Changes from the reference: the gradient id is unique per instance (the
// prototype reused id="gg"), and the glass is centred in its wrapper — the
// prototype left-aligned a fixed-width SVG inside a wider box, so it sat
// off-centre under the fit.

import { useId } from "react";

interface GobletProps {
  /** Rendered width in px. Reference default: 62. */
  width?: number;
  className?: string;
}

export function Goblet({ width = 62, className }: GobletProps) {
  const gid = `gg-${useId().replace(/:/g, "")}`;
  return (
    <div className={className} aria-hidden="true" style={{ display: "flex", justifyContent: "center" }}>
      {/* Fixed pixel width (as the reference), centred by the flex wrapper */}
      <svg viewBox="0 0 120 150" width={width} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gid} x1="0" x2="1">
            <stop offset="0" stopColor="rgba(228,226,218,.15)" />
            <stop offset=".5" stopColor="rgba(228,226,218,.5)" />
            <stop offset="1" stopColor="rgba(228,226,218,.12)" />
          </linearGradient>
        </defs>
        <path d="M28 6 Q60 -2 92 6 Q96 44 60 60 Q24 44 28 6 Z" fill={`url(#${gid})`} stroke="rgba(228,226,218,.8)" strokeWidth="2" />
        <rect x="58" y="60" width="4" height="64" fill="rgba(228,226,218,.6)" />
        <ellipse cx="60" cy="132" rx="34" ry="7" fill="rgba(228,226,218,.28)" />
        <path d="M30 10 Q40 34 60 44" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5" opacity=".6" />
      </svg>
    </div>
  );
}

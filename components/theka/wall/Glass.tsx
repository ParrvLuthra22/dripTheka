"use client";

// The wine glass from wall.html (`.lg` on the ledge, `#gm` in the panel): a bowl, a stem and a foot, with the
// liquid clipped to the bowl. The liquid is a rect scaled from the bowl's base, so it grows UP (0.8s ease-out on
// first paint; reduced motion skips the animation) in every browser. It is decoration: the text next to it
// (or the aria label) carries the meaning.

import { useEffect, useId, useState } from "react";
import { fillFraction, liquidColour, type GlassInfo } from "@/lib/theka/glassMath";
import s from "./wall.module.css";

const BOWL = "M8 4h24c0 14-4 22-12 22S8 18 8 4Z";

interface GlassSvgProps {
  glass: Pick<GlassInfo, "poured" | "cap" | "state">;
  /** "ledge": the wall glass (translucent bowl); "meter": the small outlined glass in the panel. */
  variant: "ledge" | "meter";
}

export function GlassSvg({ glass, variant }: GlassSvgProps) {
  const clip = `gc${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  // first paint: empty, then fill — a transition needs a "before"
  // (glasses only render client-side, after the fetch — no hydration to match; reduced motion starts full)
  const [shown, setShown] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    if (shown) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(id);
  }, [shown]);
  const f = shown ? fillFraction(glass) : 0;
  return (
    <svg viewBox="0 0 40 60" aria-hidden="true" focusable="false" className={variant === "ledge" ? s.glassLedge : s.glassMeter}>
      <defs><clipPath id={clip}><path d={BOWL} /></clipPath></defs>
      <rect className={s.liq} x="0" y="4" width="40" height="22" clipPath={`url(#${clip})`}
        style={{ fill: liquidColour(glass.state), transform: `scaleY(${f})` }} />
      {variant === "ledge" ? (
        <>
          <path className={s.bowl} d={BOWL} />
          <path d="M20 26v24 M12 54h16" stroke="rgba(239,235,230,.75)" strokeWidth="2.2" fill="none" />
        </>
      ) : (
        <path d={`${BOWL} M20 26v24 M12 54h16`} fill="none" stroke="currentColor" strokeWidth="2" />
      )}
    </svg>
  );
}

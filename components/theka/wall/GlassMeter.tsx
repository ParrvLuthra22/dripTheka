"use client";

// The panel meter (#gm): a small glass, the main line, then a mono sub-line. Open / last call / tapped read the
// live glass; after POUR.closesAt it says the pour is closed (no number needed). No glasses data and the pour
// still open → renders nothing (never an invented number).

import { lang } from "@/lib/theka/lang";
import { DEPOSIT_PERCENT, pourClosesLabel } from "@/lib/theka/pour";
import type { GlassInfo } from "@/lib/theka/glassMath";
import { GlassSvg } from "./Glass";
import s from "./wall.module.css";

const M = lang.glass.meter;

export function GlassMeter({ glass, closed }: { glass: GlassInfo | null; closed: boolean }) {
  if (closed) {
    return (
      <div className={s.gm} data-state="closed" role="status">
        <div><div className={s.gmt}>{M.closed}</div></div>
      </div>
    );
  }
  if (!glass) return null;
  const main = glass.state === "tapped" ? M.tapped : glass.state === "last" ? M.last(glass.left) : M.open(glass.poured, glass.cap);
  // wall.html: everything but tapped keeps the "Pour closes … · 30% reserves it" sub-line (last call included)
  const sub = glass.state === "tapped" ? M.tappedSub : M.openSub(pourClosesLabel(), DEPOSIT_PERCENT);
  return (
    <div className={s.gm} data-state={glass.state} id="gm">
      <GlassSvg glass={glass} variant="meter" />
      <div>
        <div className={s.gmt}>{main}</div>
        <div className={`${s.gms} ${s.mono}`}>{sub}</div>
      </div>
    </div>
  );
}

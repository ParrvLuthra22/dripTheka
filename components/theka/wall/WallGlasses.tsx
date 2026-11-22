"use client";

// One glass per design, on its ledge, right of its tee (wall.html `.lg`). The boxes are laid out by computeDecor()
// (px, inside #world, so they ride the camera zoom with the tees); this only fills them. With no glasses data the
// slots stay empty: no glass, no number.

import { lang } from "@/lib/theka/lang";
import { ledgeLabel, type GlassMap } from "@/lib/theka/glassMath";
import type { WallDesign } from "@/data/pour-001";
import { GlassSvg } from "./Glass";
import s from "./wall.module.css";

interface WallGlassesProps {
  designs: WallDesign[];
  glasses: GlassMap | null;
  /** Lit ledge (hover / focus), −1 = none: its label shows. */
  hover: number;
  /** A tee is zoomed: the panel meter replaces every ledge glass (wall.html `.zoomed .lg{opacity:0}`). */
  zoomed: boolean;
}

export function WallGlasses({ designs, glasses, hover, zoomed }: WallGlassesProps) {
  return (
    <>
      {designs.map((d, i) => {
        const g = glasses?.get(d.design);
        const label = g && ledgeLabel(g, lang.glass.ledge);
        return (
          <div key={d.design} className={s.glassSlot} data-glass={i}>
            {g && label && (
              <div className={s.lg} data-state={g.state} data-on={hover === i} data-zoomed={zoomed}>
                <GlassSvg glass={g} variant="ledge" />
                {/* text equivalent for the drawing: always in the DOM, visible on hover/focus (or always at last call / tapped) */}
                <span className={s.num} data-always={label.always}>{label.text}</span>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

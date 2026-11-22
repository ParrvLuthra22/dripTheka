// DOM side of the wall dressing: apply computeDecor() results as inline px, and the neon's
// flicker. No React, no layout maths — wallDecor.ts owns the numbers.

import { gsap } from "gsap";
import type { Decor } from "./wallDecor";

const q = (root: HTMLElement, sel: string) => root.querySelector<HTMLElement>(sel);

export interface DecorEls {
  neon: HTMLElement;
  enamel: HTMLElement;
  rate: HTMLElement;
  teaser: HTMLElement;
  /** Mobile story row (always in the DOM; CSS shows it under 821px). */
  story: HTMLElement;
  lamps: HTMLElement[];
  cones: HTMLElement[];
}

export function findDecor(root: HTMLElement, n: number): DecorEls | null {
  const neon = q(root, '[data-decor="neon"]'), enamel = q(root, '[data-decor="enamel"]');
  const rate = q(root, '[data-decor="rate"]'), teaser = q(root, '[data-decor="teaser"]'), story = q(root, '[data-decor="story"]');
  const lamps = Array.from({ length: n }, (_, i) => q(root, `[data-lamp="${i}"]`));
  const cones = Array.from({ length: n }, (_, i) => q(root, `[data-cone="${i}"]`));
  if (!neon || !enamel || !rate || !teaser || !story || lamps.some((e) => !e) || cones.some((e) => !e)) return null;
  return { neon, enamel, rate, teaser, story, lamps: lamps as HTMLElement[], cones: cones as HTMLElement[] };
}

/** Everything the camera should fade out with the other tees when a fit is isolated (mobile). */
export const decorAll = (e: DecorEls): HTMLElement[] => [e.neon, e.enamel, e.rate, e.teaser, e.story, ...e.cones, ...e.lamps];

const px = (v: number) => `${v}px`;

export function applyDecor(e: DecorEls, d: Decor): void {
  e.neon.parentElement?.setAttribute("data-laid", "");
  Object.assign(e.neon.style, { left: px(d.neon.cx), top: px(d.neon.cy), width: px(d.neon.w) });
  Object.assign(e.enamel.style, { left: px(d.enamel.left), top: px(d.enamel.top), width: d.enamel.width ? px(d.enamel.width) : "" });
  Object.assign(e.rate.style, { left: px(d.rate.left), top: px(d.rate.top), width: px(d.rate.width) });
  if (d.teaser) {
    Object.assign(e.teaser.style, { display: "", left: px(d.teaser.left), top: px(d.teaser.top), width: px(d.teaser.width), height: px(d.teaser.height) });
  } else e.teaser.style.display = "none";
  if (d.storyRow) Object.assign(e.story.style, { left: px(d.storyRow.left), top: px(d.storyRow.top), width: px(d.storyRow.width), height: px(d.storyRow.height) });
  d.lamps.forEach((l, i) => {
    Object.assign(e.lamps[i].style, { left: px(l.x), top: px(l.top) });
    e.lamps[i].style.setProperty("--stem", px(l.stem));
    const c = d.cones[i];
    Object.assign(e.cones[i].style, { left: px(c.left), top: px(c.top), width: px(c.width), height: px(c.height) });
  });
}

// ── the neon ───────────────────────────────────────────────────────────────
// wall.html neon(on, flick): off → dim grey tube; on → stacked glow. `flick` plays the tube
// catching: on 60ms · off 140ms · on 50ms · off 220ms · on. Reduced motion: simply on, no flicker.

const setNeon = (el: HTMLElement, on: boolean) => { el.dataset.on = on ? "true" : "false"; };

export interface NeonCtl {
  /** off, or on (with the flicker when `flick`). */
  set: (on: boolean, flick?: boolean) => void;
  /** Cancel pending flicker timelines and the tired-tube interval. */
  dispose: () => void;
}

export function createNeon(el: HTMLElement, reduced: boolean): NeonCtl {
  let tl: gsap.core.Timeline | null = null;
  let tired = 0;
  const kill = () => { tl?.kill(); tl = null; };

  const on = () => el.dataset.on === "true";
  const stopTired = () => { clearInterval(tired); tired = 0; };
  const startTired = () => {
    stopTired();
    if (reduced) return;
    // a tired tube now and then: off for 70ms every 9s while on
    tired = window.setInterval(() => {
      if (!on()) return;
      kill();
      tl = gsap.timeline().call(() => setNeon(el, false)).to({}, { duration: 0.07 }).call(() => setNeon(el, true));
    }, 9000);
  };

  return {
    set(next, flick = false) {
      kill();
      if (!next) { stopTired(); setNeon(el, false); return; }
      startTired();
      if (!flick || reduced) { setNeon(el, true); return; }
      tl = gsap.timeline()
        .call(() => setNeon(el, true)).to({}, { duration: 0.06 })
        .call(() => setNeon(el, false)).to({}, { duration: 0.14 })
        .call(() => setNeon(el, true)).to({}, { duration: 0.05 })
        .call(() => setNeon(el, false)).to({}, { duration: 0.22 })
        .call(() => setNeon(el, true));
    },
    dispose() { kill(); stopTired(); },
  };
}

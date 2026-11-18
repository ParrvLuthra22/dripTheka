"use client";

// "Lights on" — the intro that replaced the old Gate. The blackout flickers off,
// then the fits drop onto their ledges in a stagger. Plays once per session and
// never under prefers-reduced-motion (TheWall decides; this file is the timeline).

import type { Ref } from "react";
import { gsap } from "gsap";
import { lang } from "@/lib/theka/lang";
import s from "./wall.module.css";

const SEEN_KEY = "dt-wall-lights";

export function lightsSeen(): boolean {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch { return false; }
}
export function markLightsSeen(): void {
  try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* private mode */ }
}

/** The blackout panel (covers the wall until layout is measured / the intro plays). */
export function Blackout({ ref }: { ref?: Ref<HTMLDivElement> }) {
  return (
    <div ref={ref} className={s.blackout} aria-hidden="true">
      <span className={s.mono}>{lang.wall.blackout}</span>
    </div>
  );
}

interface LightsOnTargets {
  blackout: HTMLElement;
  fits: HTMLElement[];
  shadows: HTMLElement[];
  /** hello · header · tag · foot */
  chrome: HTMLElement[];
  onDone?: () => void;
}

export function playLightsOn({ blackout, fits, shadows, chrome, onDone }: LightsOnTargets): gsap.core.Timeline {
  gsap.set(blackout, { autoAlpha: 1, opacity: 1 });
  gsap.set(fits, { opacity: 0, y: -18 });
  gsap.set(shadows, { opacity: 0 });
  return gsap
    .timeline({ delay: 0.25, onComplete: () => { markLightsSeen(); onDone?.(); } })
    .to(blackout, { opacity: 0.75, duration: 0.06 })
    .to(blackout, { opacity: 1, duration: 0.08 })
    .to(blackout, { opacity: 0.35, duration: 0.06 })
    .to(blackout, { opacity: 0.9, duration: 0.1 })
    .to(blackout, { autoAlpha: 0, duration: 1.1, ease: "power2.out" })
    .to(fits, {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
      stagger: { each: 0.07, from: "start" },
      // clear the inline transform or the CSS hover lift stops working
      onComplete: () => { gsap.set(fits, { clearProps: "transform" }); },
    }, "-=.8")
    .to(shadows, { opacity: 0.75, duration: 0.9, stagger: 0.07 }, "<")
    .from(chrome, { autoAlpha: 0, y: 8, duration: 0.7, stagger: 0.08 }, "<.2");
}

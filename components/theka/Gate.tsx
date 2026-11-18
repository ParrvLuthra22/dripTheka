"use client";

// Gate — the entry screen. Timings/eases copied from bar-reference.html:
//
//   mount:  .g-mid > *  from { y:24, opacity:0 }  1s power3.out, stagger .12, delay .2
//   enter:  .g-mid      to   { opacity:0, y:-20 } .5s power2.in
//           shutter     yPercent 100 → 0          .6s power3.inOut
//           "welcome"   opacity → 1  .4s (-=.2), then → 0 .4s (delay .5)
//           onReveal()  (bar becomes visible behind the shutter)
//           shutter     yPercent → -100           .8s power3.inOut
//           gate        display:none
//           onEnter(tl) — TheBar appends its staggered entrance to THIS
//                         timeline so the reference's relative offsets hold.
//
// prefers-reduced-motion → no tweens: reveal + hide immediately.
// The gate never unmounts (display:none, like the reference) so its timeline
// is never reverted mid-flight.

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { lang } from "@/lib/theka/lang";
import { useMagnetic } from "./useMagnetic";
import s from "./bar.module.css";

interface GateProps {
  /** Background plate (shared with the bar). */
  plate: string;
  /** Called at the shutter's peak — make the bar visible underneath. */
  onReveal: () => void;
  /** Called with the running timeline after the gate hides. */
  onEnter: (tl: gsap.core.Timeline | null) => void;
  /** Skip straight past the gate (returning within the session). */
  skipped: boolean;
}

const G = lang.bar.gate;

export function Gate({ plate, onReveal, onEnter, skipped }: GateProps) {
  const gateRef    = useRef<HTMLElement>(null);
  const midRef     = useRef<HTMLDivElement>(null);
  const shutterRef = useRef<HTMLDivElement>(null);
  const smRef      = useRef<HTMLDivElement>(null);
  const enterRef   = useMagnetic<HTMLButtonElement>();
  const busy       = useRef(false);

  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Entrance stagger
  useEffect(() => {
    const mid = midRef.current;
    if (!mid || skipped || reduced()) return;
    const tw = gsap.from(Array.from(mid.children), {
      y: 24, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.2,
    });
    return () => { tw.revert(); };
  }, [skipped]);

  const enter = () => {
    const gate = gateRef.current, mid = midRef.current;
    const shutter = shutterRef.current, sm = smRef.current;
    if (!gate || !mid || !shutter || !sm || busy.current) return;
    busy.current = true;

    if (reduced()) {
      onReveal();
      gate.style.display = "none";
      onEnter(null);
      return;
    }

    const tl = gsap.timeline();
    tl.to(mid, { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" })
      // CSS parks the shutter at translateY(100%) so SSR never flashes cobalt;
      // normalise to the reference's gsap state (y:0, yPercent:100) first.
      .set(shutter, { y: 0, yPercent: 100 })
      .to(shutter, { yPercent: 0, duration: 0.6, ease: "power3.inOut" })
      .to(sm, { opacity: 1, duration: 0.4 }, "-=.2")
      .to(sm, { opacity: 0, duration: 0.4, delay: 0.5 })
      .add(() => onReveal())
      .to(shutter, { yPercent: -100, duration: 0.8, ease: "power3.inOut" })
      .add(() => { gate.style.display = "none"; });
    onEnter(tl);
  };

  return (
    <section
      ref={gateRef}
      className={s.gate}
      style={skipped ? { display: "none" } : undefined}
      aria-hidden={skipped || undefined}
    >
      <Image className={s.bg} src={plate} alt="" fill priority sizes="100vw" />
      <div className={s.vg} />
      <div className={s.gTop}><span>{G.est}</span><span>{G.city}</span></div>
      <div ref={midRef} className={s.gMid}>
        <div className={s.gEyebrow}>{G.eyebrow}</div>
        <h1 className={s.gMark}>{G.mark}</h1>
        <div className={s.gTag}>{G.tag}</div>
        <button ref={enterRef} type="button" className={s.enter} data-mag data-hover onClick={enter}>
          <span className={s.bgf} />{G.enter}
        </button>
        <div className={s.gFine}>{G.fine}</div>
      </div>
      <div ref={shutterRef} className={s.shutter} aria-hidden="true">
        <div ref={smRef} className={`${s.sm} ${s.serif}`}>{G.welcome}</div>
      </div>
    </section>
  );
}

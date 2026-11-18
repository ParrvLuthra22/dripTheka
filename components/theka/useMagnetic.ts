"use client";

// useMagnetic — GSAP magnetic pull, ported from bar-reference.html [data-mag]:
//   mousemove → gsap.to(el, { x: dx*0.3, y: dy*0.4, duration: .4, ease: "power3.out" })
//   mouseleave → gsap.to(el, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.4)" })
//
// Desktop only: no-ops on touch (hover: none), at ≤820px, and under
// prefers-reduced-motion.
//
//   const ref = useMagnetic<HTMLButtonElement>();
//   <button ref={ref} data-mag>…</button>

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface MagneticOptions {
  /** Horizontal pull factor. Reference: 0.3 */
  x?: number;
  /** Vertical pull factor. Reference: 0.4 */
  y?: number;
}

const DESKTOP = "(hover: hover) and (pointer: fine) and (min-width: 821px)";

export function useMagnetic<T extends HTMLElement = HTMLElement>({
  x = 0.3,
  y = 0.4,
}: MagneticOptions = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia(DESKTOP).matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - r.left - r.width / 2) * x,
        y: (e.clientY - r.top - r.height / 2) * y,
        duration: 0.4,
        ease: "power3.out",
      });
    };
    const onLeave = () =>
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,.4)" });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [x, y]);

  return ref;
}

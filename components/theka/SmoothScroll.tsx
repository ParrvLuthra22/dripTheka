"use client";

// SmoothScroll — Lenis, driven by the GSAP ticker so ScrollTrigger and Lenis
// share one rAF. Wrap the (site) layout, never the root layout.
//
// • prefers-reduced-motion → Lenis is not created; native scroll is used.
// • useLenis() exposes the instance (null when disabled) for scrollTo calls.
// • PourTransition calls resetScroll() while the shutter fully covers the
//   viewport, so the new route always opens at the top, invisibly.

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** The active Lenis instance, or null (reduced motion / SSR). */
export function useLenis() {
  return useContext(LenisContext);
}

let current: Lenis | null = null;

/** Jump to the top immediately — works with or without Lenis. */
export function resetScroll() {
  if (current) current.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const instance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    current = instance;
    // Publishing the instance to context is the point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      if (current === instance) current = null;
      setLenis(null);
    };
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}

"use client";

// SurfaceTracker — deterministically resolves which declared surface sits
// behind the floating PintGlass (fixed bottom-right, ~80px inset).
//
// Sections opt in with `data-surface="blue|cream|ink"`. On scroll (rAF-throttled)
// we find the top-most declared section whose rect contains the glass's screen
// point and write it to the surface store. No elementFromPoint (which would hit
// the glass itself) — we read section rects directly, so it's deterministic.
//
// Default surface is "cream" (store default) when nothing is declared behind it.

import { useEffect } from "react";
import { useSurfaceStore, type Surface } from "@/lib/store/surface";

// Matches PintGlass: fixed bottom-20 right-20 (5rem = 80px), glass ~72px wide.
const INSET = 80 + 36; // inset + half glass, so we sample the glass centre-ish

export function SurfaceTracker() {
  const setSurface = useSurfaceStore((s) => s.setSurface);

  useEffect(() => {
    let rafId = 0;
    let queued = false;

    const resolve = () => {
      queued = false;
      const px = window.innerWidth - INSET;
      const py = window.innerHeight - INSET;

      const sections = document.querySelectorAll<HTMLElement>("[data-surface]");
      let found: Surface | null = null;
      // Iterate in DOM order; later matches (painted on top) win.
      sections.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          const s = el.dataset.surface as Surface | undefined;
          if (s === "blue" || s === "cream" || s === "ink") found = s;
        }
      });

      setSurface(found ?? "cream");
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      rafId = requestAnimationFrame(resolve);
    };

    resolve(); // initial
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [setSurface]);

  return null;
}

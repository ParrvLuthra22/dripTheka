"use client";

// SurfaceTracker — resolves which declared surface sits behind the floating
// PintGlass (fixed bottom-right) and writes it to the surface store.
//
// Sections opt in with `data-surface="blue|cream|ink"`. We sample the glass's
// real vertical band — three points spanning its height — and take the majority
// declared surface, instead of one corner point (a single bottom-right point
// missed short blue sections whose bottom edge never reached it).
//
// IMPORTANT: this runs on a requestAnimationFrame loop that re-resolves whenever
// the scroll position or viewport changes — NOT on window "scroll" events. The
// site uses Lenis smooth-scroll, which does not reliably emit native window
// scroll events, so a scroll-listener version only resolved once at mount and
// left the glass stuck on its load-time colour (camouflaging elsewhere).
//
// No elementFromPoint (would hit the glass itself). No pixel colour sampling
// (fragile, flickers). Just section rects — deterministic.
//
// Nothing declared behind the glass → "cream" (cobalt liquid). That cobalt state
// carries a cream outline (see PintGlass) so it stays visible even over an
// undeclared blue area — the safety net.

import { useEffect } from "react";
import { useSurfaceStore, type Surface } from "@/lib/store/surface";

// PintGlass: fixed bottom-20 right-20 (80px), glass ~72×96. Its centre x is
// ~vw-116; it spans y from ~vh-176 (top) to ~vh-80 (bottom).
const GLASS_X_INSET = 116;
const GLASS_Y_TOP   = 160; // vh - 160  (upper band)
const GLASS_Y_MID   = 120; // vh - 120  (centre)
const GLASS_Y_BOT   = 84;  // vh - 84   (lower band)

export function SurfaceTracker() {
  const setSurface = useSurfaceStore((s) => s.setSurface);

  useEffect(() => {
    let rafId = 0;

    const surfaceAt = (px: number, py: number): Surface | null => {
      let hit: Surface | null = null;
      // DOM order; later (painted-on-top) declarations win.
      document.querySelectorAll<HTMLElement>("[data-surface]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          const s = el.dataset.surface;
          if (s === "blue" || s === "cream" || s === "ink") hit = s;
        }
      });
      return hit;
    };

    const resolve = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const px = vw - GLASS_X_INSET;

      const samples = [
        surfaceAt(px, vh - GLASS_Y_TOP),
        surfaceAt(px, vh - GLASS_Y_MID),
        surfaceAt(px, vh - GLASS_Y_BOT),
      ];
      const tally: Record<Surface, number> = { blue: 0, cream: 0, ink: 0 };
      for (const s of samples) if (s) tally[s]++;

      let winner: Surface = "cream";
      let best = 0;
      (["blue", "ink", "cream"] as Surface[]).forEach((s) => {
        if (tally[s] > best) { best = tally[s]; winner = s; }
      });
      setSurface(best > 0 ? winner : "cream");
    };

    // Re-resolve continuously so the glass always matches the surface behind it.
    // A rAF loop handles smooth (Lenis) scrolling in real browsers; a scroll
    // listener + resize cover cases where rAF is throttled. Sampling is a few
    // [data-surface] rects — cheap; the store's equality guard prevents
    // redundant re-renders.
    const loop = () => {
      resolve();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    window.addEventListener("scroll", resolve, { passive: true });
    window.addEventListener("resize", resolve, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", resolve);
      window.removeEventListener("resize", resolve);
    };
  }, [setSurface]);

  return null;
}

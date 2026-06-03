"use client";

// MorphingLogo — the signature moment.
//
// There is exactly ONE logo element on the page. It's position:fixed.
// As the user scrolls, it interpolates from the hero center (large, ~60vw)
// to the navbar center (small, 36px height).
//
// Coordination:
//   • Hero exports a div with `data-morph-anchor="hero"` at the position
//     where the logo should sit at scroll=0.
//   • Nav exports a div with `data-morph-anchor="nav"` at the navbar center.
//   • This component reads both anchor rects and lerps between them based
//     on scrollY normalized to viewport height.
//
// Only mounts on the homepage (or any page that has the hero anchor).
// On pages without a hero anchor → snaps directly to nav anchor.

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Rect { left: number; top: number; width: number; height: number }

function readAnchor(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    left: r.left + window.scrollX,
    top:  r.top  + window.scrollY,
    width:  r.width,
    height: r.height,
  };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function MorphingLogo() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let rafId = 0;
    let heroRect: Rect | null = null;
    let navRect:  Rect | null = null;

    function measure() {
      heroRect = readAnchor('[data-morph-anchor="hero"]');
      navRect  = readAnchor('[data-morph-anchor="nav"]');
      if (heroRect && navRect) setReady(true);
    }

    function tick() {
      // If the anchors haven't been measured yet, try again
      if (!heroRect || !navRect) {
        measure();
        rafId = requestAnimationFrame(tick);
        return;
      }
      const el = wrapperRef.current;
      if (!el) return;

      // Hero anchor's TOP in viewport coordinates
      const heroVisualTop = heroRect.top - window.scrollY;
      const heroVisualBot = heroVisualTop + heroRect.height;

      // Progress: 0 when hero anchor is fully visible at its rest position,
      // 1 when hero anchor has scrolled out of the top.
      // We start morphing once the hero center crosses the viewport's 30% mark.
      const vh = window.innerHeight;
      const start = vh * 0.5;
      const end   = -heroRect.height * 0.3; // hero almost out of view
      const range = start - end;
      const t     = Math.min(1, Math.max(0, (start - heroVisualTop) / range));
      const eased = easeOutCubic(t);

      // Nav anchor position (this is the destination; in viewport coords)
      const navVisualLeft = navRect.left - window.scrollX;
      const navVisualTop  = navRect.top  - window.scrollY;

      // Interpolate position + size between hero anchor and nav anchor
      const left    = lerp(heroRect.left, navVisualLeft, eased);
      const top     = lerp(heroVisualTop, navVisualTop, eased);
      const width   = lerp(heroRect.width,  navRect.width,  eased);
      const height  = lerp(heroRect.height, navRect.height, eased);

      el.style.left   = `${left}px`;
      el.style.top    = `${top}px`;
      el.style.width  = `${width}px`;
      el.style.height = `${height}px`;

      rafId = requestAnimationFrame(tick);
    }

    measure();
    rafId = requestAnimationFrame(tick);

    const onResize = () => { measure(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none select-none z-40"
      style={{
        position: "fixed",
        left: 0,
        top:  0,
        width:  0,
        height: 0,
        opacity: ready ? 1 : 0,
        transition: "opacity 0.35s ease",
        willChange: "left, top, width, height",
      }}
    >
      <Image
        src="/dtlogo-cropped.png"
        alt=""
        width={1412}
        height={564}
        priority
        draggable={false}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

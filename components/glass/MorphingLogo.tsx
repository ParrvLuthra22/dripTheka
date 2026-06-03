"use client";

// MorphingLogo — the signature moment.
//
// Sole renderer of the dtlogo PNG across the app. Position:fixed.
//
// On homepage:
//   • Hidden during hero scramble entrance
//   • Becomes visible when Hero dispatches "drip-theka:hero-ready" event
//   • Reads two anchor rects:
//       data-morph-anchor="hero" → big position (hero section)
//       data-morph-anchor="nav"  → small position (navbar center)
//   • Interpolates position + size based on scroll progress through hero
//
// On other pages (no hero anchor):
//   • Visible immediately
//   • Snaps to nav anchor (small)

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

interface Rect { left: number; top: number; width: number; height: number }
const READY_EVENT = "drip-theka:hero-ready";

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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function MorphingLogo() {
  const pathname     = usePathname();
  const wrapperRef   = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Decide initial visibility:
  // • Homepage + first visit: hidden, wait for hero-ready
  // • Homepage + replay session: visible immediately (hero played already)
  // • Other pages: visible immediately (no hero on these routes)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isHome    = pathname === "/";
    const heroSeen  = !!sessionStorage.getItem("dt-hero-played");

    if (!isHome) {
      setVisible(true);
      return;
    }
    if (heroSeen) {
      // Even on home, if scramble has already played this session, show now
      setVisible(true);
      return;
    }

    // Otherwise wait for Hero to broadcast ready
    setVisible(false);
    const onReady = () => setVisible(true);
    window.addEventListener(READY_EVENT, onReady);
    return () => window.removeEventListener(READY_EVENT, onReady);
  }, [pathname]);

  // Position interpolation loop
  useEffect(() => {
    if (!visible) return;

    let rafId = 0;
    let heroRect: Rect | null = null;
    let navRect:  Rect | null = null;

    function measure() {
      heroRect = readAnchor('[data-morph-anchor="hero"]');
      navRect  = readAnchor('[data-morph-anchor="nav"]');
    }

    function tick() {
      // Try to re-measure if anchors were missing
      if (!heroRect || !navRect) {
        measure();
      }

      const el = wrapperRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // No hero anchor (we're on a non-hero page) → snap to nav
      if (!heroRect && navRect) {
        const navVisualLeft = navRect.left - window.scrollX;
        const navVisualTop  = navRect.top  - window.scrollY;
        el.style.left   = `${navVisualLeft}px`;
        el.style.top    = `${navVisualTop}px`;
        el.style.width  = `${navRect.width}px`;
        el.style.height = `${navRect.height}px`;
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (!heroRect || !navRect) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Both anchors known — interpolate based on scroll progress
      const vh           = window.innerHeight;
      const heroVisTop   = heroRect.top - window.scrollY;
      // Progress: 0 when hero anchor is in its rest position,
      // 1 when hero anchor has scrolled well past the top.
      const start        = vh * 0.5;
      const end          = -heroRect.height * 0.3;
      const range        = start - end;
      const t            = Math.min(1, Math.max(0, (start - heroVisTop) / range));
      const eased        = easeOutCubic(t);

      const navVisualLeft = navRect.left - window.scrollX;
      const navVisualTop  = navRect.top  - window.scrollY;

      const left   = lerp(heroRect.left, navVisualLeft, eased);
      const top    = lerp(heroVisTop,    navVisualTop,  eased);
      const width  = lerp(heroRect.width,  navRect.width,  eased);
      const height = lerp(heroRect.height, navRect.height, eased);

      el.style.left   = `${left}px`;
      el.style.top    = `${top}px`;
      el.style.width  = `${width}px`;
      el.style.height = `${height}px`;

      rafId = requestAnimationFrame(tick);
    }

    measure();
    rafId = requestAnimationFrame(tick);

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [visible, pathname]);

  return (
    <div
      ref={wrapperRef}
      aria-hidden="true"
      className="pointer-events-none select-none"
      style={{
        position: "fixed",
        left: 0,
        top:  0,
        width:  0,
        height: 0,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease",
        willChange: "left, top, width, height",
        // z-index: above page content (z-30) but below nav links (z-50)
        // so the nav's text isn't covered when logo is small inside the nav
        zIndex: 45,
      }}
    >
      <Image
        src="/dtlogo-cropped.png"
        alt="Drip Theka"
        width={1412}
        height={564}
        priority
        draggable={false}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

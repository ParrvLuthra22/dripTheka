"use client";

// MorphingLogo — the signature moment.
//
// Sole renderer of the dtlogo PNG across the app. Position:fixed.
//
// On homepage:
//   • Hidden during hero scramble entrance
//   • Becomes visible when Hero dispatches "drip-theka:hero-ready" event
//   • Reads two anchor rects:
//       data-morph-anchor="hero" → big position (hero section, document flow)
//       data-morph-anchor="nav"  → small position (navbar center, FIXED)
//   • Interpolates position + size based on scroll progress through hero
//
// On other pages (no hero anchor):
//   • Visible immediately
//   • Snaps to nav anchor (small)
//
// Anchor measurement — the two anchors live in different coordinate spaces:
//   • hero anchor is in normal document flow → its absolute document position
//     is stable, measure once and convert to viewport coords by subtracting
//     scroll each frame.
//   • nav anchor is inside a position:fixed header → its VIEWPORT position is
//     what matters and it can move (the nav hides/shows on scroll), so it must
//     be measured live every frame with getBoundingClientRect (no scroll math).
//
// The logo is also a link home — clicking it navigates to "/".

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";

interface Rect { left: number; top: number; width: number; height: number }
const READY_EVENT = "drip-theka:hero-ready";

// Document-absolute anchor (for the hero, which scrolls with the page).
function readAbsoluteAnchor(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden (e.g. display:none)
  return {
    left: r.left + window.scrollX,
    top:  r.top  + window.scrollY,
    width:  r.width,
    height: r.height,
  };
}

// Viewport-relative anchor (for the fixed nav — measured live each frame).
function readViewportAnchor(selector: string): Rect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden below the md breakpoint
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function MorphingLogo() {
  const pathname     = usePathname();
  const router       = useRouter();
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

    function measureHero() {
      heroRect = readAbsoluteAnchor('[data-morph-anchor="hero"]');
    }

    function tick() {
      const el = wrapperRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Nav anchor — fixed element, measure LIVE in viewport space every frame
      // so the logo tracks the navbar even as it hides/shows on scroll.
      const navRect = readViewportAnchor('[data-morph-anchor="nav"]');

      // Hero anchor — re-measure if we lost it (route changes, late mount)
      if (!heroRect) measureHero();

      // No dock target (mobile: nav center anchor is display:none) → follow the
      // hero position only and let it scroll away naturally.
      if (!navRect) {
        if (heroRect) {
          el.style.left   = `${heroRect.left - window.scrollX}px`;
          el.style.top    = `${heroRect.top  - window.scrollY}px`;
          el.style.width  = `${heroRect.width}px`;
          el.style.height = `${heroRect.height}px`;
        }
        rafId = requestAnimationFrame(tick);
        return;
      }

      // No hero anchor (non-hero page) → snap straight to the nav.
      if (!heroRect) {
        el.style.left   = `${navRect.left}px`;
        el.style.top    = `${navRect.top}px`;
        el.style.width  = `${navRect.width}px`;
        el.style.height = `${navRect.height}px`;
        rafId = requestAnimationFrame(tick);
        return;
      }

      // Both anchors known — interpolate based on scroll progress.
      const vh           = window.innerHeight;
      const heroVisTop   = heroRect.top - window.scrollY;
      const heroVisLeft  = heroRect.left - window.scrollX;
      // Progress: 0 when hero anchor is in its rest position,
      // 1 when hero anchor has scrolled well past the top.
      const start        = vh * 0.5;
      const end          = -heroRect.height * 0.3;
      const range        = start - end;
      const t            = Math.min(1, Math.max(0, (start - heroVisTop) / range));
      const eased        = easeOutCubic(t);

      const left   = lerp(heroVisLeft,    navRect.left,   eased);
      const top    = lerp(heroVisTop,     navRect.top,    eased);
      const width  = lerp(heroRect.width,  navRect.width,  eased);
      const height = lerp(heroRect.height, navRect.height, eased);

      el.style.left   = `${left}px`;
      el.style.top    = `${top}px`;
      el.style.width  = `${width}px`;
      el.style.height = `${height}px`;

      rafId = requestAnimationFrame(tick);
    }

    measureHero();
    rafId = requestAnimationFrame(tick);

    const onResize = () => measureHero();
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, [visible, pathname]);

  const goHome = () => router.push("/");

  return (
    <div
      ref={wrapperRef}
      className="select-none"
      style={{
        position: "fixed",
        left: 0,
        top:  0,
        width:  0,
        height: 0,
        opacity: visible ? 1 : 0,
        // pointer-events follow visibility so the invisible box never traps clicks
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity 0.5s ease",
        willChange: "left, top, width, height",
        // z-index: above the nav stacking context (z-50) so the nav background
        // doesn't paint over the logo. The logo is centered so it never
        // overlaps the left/right nav links.
        zIndex: 51,
      }}
    >
      <button
        type="button"
        onClick={goHome}
        aria-label="Drip Theka — go to homepage"
        data-hover
        className="block w-full h-full cursor-pointer bg-transparent border-0 p-0"
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
      </button>
    </div>
  );
}

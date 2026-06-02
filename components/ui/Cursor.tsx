"use client";

// Custom cursor — desktop (pointer: fine) only.
//
// Two layers:
//   dot  (8px)  — follows mouse 1:1, no lag
//   ring (40px) — lerps behind with factor 0.15
//
// Both use mix-blend-mode: difference with white fill/stroke,
// so they read correctly on any background colour.
//
// State changes driven by event delegation on [data-hover] / [data-hover-big]:
//   default    → dot 8px,  ring 40px visible
//   hover      → dot 24px, ring fades out
//   hover-big  → dot 64px (cream fill), ring hidden

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type CursorState = "default" | "hover" | "hover-big";

// How far from the cursor centre each element should be offset
// (we position via top-left so subtract half of element size)
const DOT_R  = 4;   // half of 8px
const RING_R = 20;  // half of 40px
const BIG_R  = 32;  // half of 64px

export function Cursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const [visible,     setVisible]     = useState(false);
  const [cursorState, setCursorState] = useState<CursorState>("default");

  // Refs so the rAF loop always sees fresh values without re-subscribing
  const mouse = useRef({ x: 0, y: 0 });
  const ring  = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);
  // Whether this device has a fine pointer (desktop mouse)
  const isDesktop = useRef(false);

  useEffect(() => {
    isDesktop.current = window.matchMedia("(pointer: fine)").matches;
    if (!isDesktop.current) return; // mobile / touch → bail out

    const dot  = dotRef.current;
    const rng  = ringRef.current;
    if (!dot || !rng) return;

    // ── Mouse position tracking ──────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };

      // Position dot immediately (1:1)
      gsap.set(dot, { x: e.clientX - DOT_R, y: e.clientY - DOT_R });

      if (!visible) {
        // First move — snap ring to position and show
        ring.current = { x: e.clientX, y: e.clientY };
        setVisible(true);
      }
    };

    // ── Element state detection ──────────────────────────────────────
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      if      (target.closest("[data-hover-big]")) setCursorState("hover-big");
      else if (target.closest("[data-hover]"))     setCursorState("hover");
      else                                          setCursorState("default");
    };

    const onMouseLeave = () => setVisible(false);

    // ── Ring lerp loop ───────────────────────────────────────────────
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const tick = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.15);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.15);
      gsap.set(rng, {
        x: ring.current.x - RING_R,
        y: ring.current.y - RING_R,
      });
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);

    document.addEventListener("mousemove",   onMouseMove);
    document.addEventListener("mouseover",   onMouseOver);
    document.addEventListener("mouseleave",  onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("mousemove",  onMouseMove);
      document.removeEventListener("mouseover",  onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount once

  // ── Cursor state → GSAP appearance transitions ───────────────────────
  useEffect(() => {
    const dot = dotRef.current;
    const rng = ringRef.current;
    if (!dot || !rng) return;

    switch (cursorState) {
      case "hover":
        gsap.to(dot, { width: 24, height: 24, x: `-=${24 - 8}px`, duration: 0.25, ease: "power2.out" });
        // Adjust x so cursor stays centred (width grew by 16px, so shift left 8px)
        gsap.to(dot, { x: "-=8", duration: 0 }); // applied simultaneously via GSAP set below
        gsap.to(rng, { opacity: 0, duration: 0.2 });
        // Easier: just animate width/height and let GSAP handle it
        gsap.to(dot, {
          width: 24, height: 24,
          marginLeft: -(24 / 2 - DOT_R),
          marginTop:  -(24 / 2 - DOT_R),
          duration: 0.25,
          ease: "power2.out",
          overwrite: true,
        });
        gsap.to(rng, { opacity: 0, scale: 0.6, duration: 0.2, overwrite: true });
        break;

      case "hover-big":
        gsap.to(dot, {
          width:      64,
          height:     64,
          marginLeft: -(BIG_R - DOT_R),
          marginTop:  -(BIG_R - DOT_R),
          backgroundColor: "#E4E2DD", // cream fill — becomes visible against ink/blue
          duration: 0.35,
          ease: "power3.out",
          overwrite: true,
        });
        gsap.to(rng, { opacity: 0, scale: 0.3, duration: 0.2, overwrite: true });
        break;

      default:
        gsap.to(dot, {
          width:      8,
          height:     8,
          marginLeft: 0,
          marginTop:  0,
          backgroundColor: "#ffffff",
          duration: 0.3,
          ease: "power2.out",
          overwrite: true,
        });
        gsap.to(rng, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out", overwrite: true });
    }
  }, [cursorState]);

  // On mobile / coarse pointer, render nothing
  // We check inside useEffect; before mount just render the elements hidden
  // so SSR doesn't complain about missing markup.

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform rounded-full"
        style={{
          width:          DOT_R * 2,
          height:         DOT_R * 2,
          backgroundColor: "#ffffff",
          mixBlendMode:   "difference",
          opacity:         visible ? 1 : 0,
          transition:     "opacity 0.2s",
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform rounded-full"
        style={{
          width:        RING_R * 2,
          height:       RING_R * 2,
          border:       "1px solid #ffffff",
          mixBlendMode: "difference",
          opacity:       visible ? 1 : 0,
          transition:   "opacity 0.2s",
        }}
      />
    </>
  );
}

"use client";

// Custom cursor — desktop only (pointer: fine).
//
// Three visual layers:
//   dot   (8px)  — follows mouse 1:1 (no lag)
//   ring  (40px) — lerps behind at factor 0.15
//   label (pill) — shows action text/icon when over [data-cursor="..."] elements
//
// State priority (highest first):
//   [data-hover-big] → 64px cream dot (CTAs)
//   [data-cursor]    → label pill with text (images, cart, drag, link)
//   [data-hover]     → 24px dot + faded ring
//   default          → 8px dot + 40px ring
//
// All layers use mix-blend-mode: difference so they read on any background.

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type CursorVariant = "default" | "hover" | "hover-big" | "label";
type CursorLabel   = string;

const DOT_R  = 4;
const RING_R = 20;
const BIG_R  = 32;

export function Cursor() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [label,   setLabel]   = useState<CursorLabel>("");

  const mouse  = useRef({ x: 0, y: 0 });
  const ring   = useRef({ x: 0, y: 0 });
  const rafId  = useRef<number>(0);

  useEffect(() => {
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    if (!isDesktop) return;

    const dot = dotRef.current;
    const rng = ringRef.current;
    const lbl = labelRef.current;
    if (!dot || !rng || !lbl) return;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      gsap.set(dot, { x: e.clientX - DOT_R, y: e.clientY - DOT_R });
      gsap.set(lbl, { x: e.clientX, y: e.clientY });
      if (!visible) {
        ring.current = { x: e.clientX, y: e.clientY };
        setVisible(true);
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      // Priority order
      if (target.closest("[data-hover-big]")) {
        setVariant("hover-big");
        setLabel("");
        return;
      }
      const labelEl = target.closest("[data-cursor]") as HTMLElement | null;
      if (labelEl) {
        const txt = labelEl.dataset.cursor || "";
        setVariant("label");
        setLabel(txt);
        return;
      }
      if (target.closest("[data-hover]")) {
        setVariant("hover");
        setLabel("");
        return;
      }
      setVariant("default");
      setLabel("");
    };

    const onMouseLeave = () => setVisible(false);

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

    document.addEventListener("mousemove",  onMouseMove);
    document.addEventListener("mouseover",  onMouseOver);
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId.current);
      document.removeEventListener("mousemove",  onMouseMove);
      document.removeEventListener("mouseover",  onMouseOver);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Variant → visual transitions
  useEffect(() => {
    const dot = dotRef.current;
    const rng = ringRef.current;
    const lbl = labelRef.current;
    if (!dot || !rng || !lbl) return;

    switch (variant) {
      case "hover":
        gsap.to(dot, {
          width: 24, height: 24,
          marginLeft: -(24 / 2 - DOT_R),
          marginTop:  -(24 / 2 - DOT_R),
          backgroundColor: "#ffffff",
          duration: 0.25, ease: "power2.out", overwrite: true,
        });
        gsap.to(rng, { opacity: 0, scale: 0.6, duration: 0.2, overwrite: true });
        gsap.to(lbl, { opacity: 0, scale: 0.7, duration: 0.15, overwrite: true });
        break;

      case "hover-big":
        gsap.to(dot, {
          width: 64, height: 64,
          marginLeft: -(BIG_R - DOT_R),
          marginTop:  -(BIG_R - DOT_R),
          backgroundColor: "#E4E2DD",
          duration: 0.35, ease: "power3.out", overwrite: true,
        });
        gsap.to(rng, { opacity: 0, scale: 0.3, duration: 0.2, overwrite: true });
        gsap.to(lbl, { opacity: 0, scale: 0.7, duration: 0.15, overwrite: true });
        break;

      case "label":
        // Dot fades, ring fades, label pill appears
        gsap.to(dot, { opacity: 0, scale: 0.5, duration: 0.2, overwrite: true });
        gsap.to(rng, { opacity: 0, scale: 0.5, duration: 0.2, overwrite: true });
        gsap.to(lbl, { opacity: 1, scale: 1,   duration: 0.25, ease: "power2.out", overwrite: true });
        break;

      default:
        gsap.to(dot, {
          width: 8, height: 8,
          marginLeft: 0, marginTop: 0,
          backgroundColor: "#ffffff",
          opacity: 1, scale: 1,
          duration: 0.3, ease: "power2.out", overwrite: true,
        });
        gsap.to(rng, { opacity: 1, scale: 1, duration: 0.35, ease: "power2.out", overwrite: true });
        gsap.to(lbl, { opacity: 0, scale: 0.7, duration: 0.15, overwrite: true });
    }
  }, [variant]);

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform rounded-full"
        style={{
          width:  DOT_R * 2,
          height: DOT_R * 2,
          backgroundColor: "#ffffff",
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />

      {/* Ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform rounded-full"
        style={{
          width:  RING_R * 2,
          height: RING_R * 2,
          border: "1px solid #ffffff",
          mixBlendMode: "difference",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />

      {/* Label pill — appears on [data-cursor] elements */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform"
        style={{
          opacity: 0,
          transform: "translate(-50%, -50%) scale(0.7)",
          backgroundColor: "#ffffff",
          color: "#000000",
          mixBlendMode: "difference",
          padding: "8px 16px",
          borderRadius: 999,
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label || "·"}
      </div>
    </>
  );
}

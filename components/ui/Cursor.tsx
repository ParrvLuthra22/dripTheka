"use client";

// Custom cursor — desktop (fine-pointer) only, portaled to <body> so no
// overflow/clip context can ever hide it.
//
// Three visual layers:
//   dot   (8px)  — follows mouse 1:1 (no lag)
//   ring  (40px) — lerps behind at factor 0.15 (1:1 under reduced-motion)
//   label (pill) — solid opaque cream/ink pill; action text or size letter
//
// State priority (highest first):
//   [data-cursor-size] → pill shows the size LETTER (bottle-cap hover)
//   [data-hover-big]   → 64px cream dot (CTAs)
//   [data-cursor]      → pill with action text (view / add / drag / link)
//   [data-hover]       → 24px dot + faded ring
//   default            → 8px dot + 40px ring
//
// The dot/ring use mix-blend-mode: difference so they read on any background.
// The LABEL pill is deliberately solid + opaque (no blend) so it stays legible.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";
import { useHangoverStore } from "@/lib/store/hangover";

type CursorVariant = "default" | "hover" | "hover-big" | "label";

const DOT_R  = 4;
const RING_R = 20;
const BIG_R  = 32;

export function Cursor() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [variant, setVariant] = useState<CursorVariant>("default");
  const [label,   setLabel]   = useState<string>("");

  const mouse  = useRef({ x: 0, y: 0 });
  const ring   = useRef({ x: 0, y: 0 });
  const rafId  = useRef<number>(0);

  const { isHungover } = useHangoverStore();
  const isHungoverRef  = useRef(isHungover);
  useEffect(() => { isHungoverRef.current = isHungover; }, [isHungover]);

  // Mount gate — only enable on fine-pointer (desktop) devices.
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    setEnabled(fine.matches);
    const onChange = () => setEnabled(fine.matches);
    fine.addEventListener?.("change", onChange);
    return () => fine.removeEventListener?.("change", onChange);
  }, []);

  // Hide the OS cursor only while the custom one is active.
  useEffect(() => {
    if (!enabled) return;
    document.body.style.cursor = "none";
    return () => { document.body.style.cursor = ""; };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const rng = ringRef.current;
    const lbl = labelRef.current;
    if (!dot || !rng || !lbl) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      gsap.set(lbl, { x: e.clientX, y: e.clientY });
      if (!visible) {
        ring.current = { x: e.clientX, y: e.clientY };
        setVisible(true);
      }
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      // Bottle-cap size reveal — highest priority
      const sizeEl = target.closest("[data-cursor-size]") as HTMLElement | null;
      if (sizeEl) {
        setVariant("label");
        setLabel(sizeEl.dataset.cursorSize || "");
        return;
      }
      if (target.closest("[data-hover-big]")) {
        setVariant("hover-big");
        setLabel("");
        return;
      }
      const labelEl = target.closest("[data-cursor]") as HTMLElement | null;
      if (labelEl) {
        setVariant("label");
        setLabel(labelEl.dataset.cursor || "");
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
      const t = performance.now();
      const wobbleX = isHungoverRef.current && !reducedMotion
        ? 2 * Math.sin(2 * Math.PI * t / 1200)
        : 0;
      const wobbleY = isHungoverRef.current && !reducedMotion
        ? 2 * Math.sin(2 * Math.PI * t / 1200 + Math.PI / 2)
        : 0;

      gsap.set(dot, {
        x: mouse.current.x - DOT_R + wobbleX,
        y: mouse.current.y - DOT_R + wobbleY,
      });

      // Reduced motion → ring follows 1:1 (no smoothing/lag).
      const factor = reducedMotion ? 1 : 0.15;
      ring.current.x = lerp(ring.current.x, mouse.current.x, factor);
      ring.current.y = lerp(ring.current.y, mouse.current.y, factor);
      gsap.set(rng, {
        x: ring.current.x - RING_R + wobbleX,
        y: ring.current.y - RING_R + wobbleY,
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
  }, [enabled]);

  // Variant → visual transitions
  useEffect(() => {
    if (!enabled) return;
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
  }, [variant, enabled]);

  if (!mounted || !enabled) return null;

  return createPortal(
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

      {/* Label pill — solid, opaque, always readable (no blend mode) */}
      <div
        ref={labelRef}
        aria-hidden="true"
        className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform"
        style={{
          opacity: 0,
          transform: "translate(-50%, -50%) scale(0.7)",
          backgroundColor: "#E4E2DD",
          color: "#141518",
          padding: "7px 14px",
          borderRadius: 999,
          boxShadow: "0 2px 10px rgba(20,21,24,0.35)",
          fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {label || "·"}
      </div>
    </>,
    document.body
  );
}

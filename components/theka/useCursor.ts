"use client";

// useCursor — The Bar's custom cursor, ported from bar-reference.html:
//   • dot + label follow the mouse 1:1
//   • ring lerps behind at 0.18 per frame
//   • hovering any [data-hover] inside `root` turns the ring into the large
//     cream label-ring (.lbl → mix-blend-mode:normal) and shows the label
//
// Desktop only — CSS hides the elements under (hover:none) / ≤820px, and the
// listeners only attach when a fine, hover-capable pointer is present.
// Reduced motion: ring follows 1:1 (no lag).

import { useEffect, useRef, type RefObject } from "react";

const DESKTOP = "(hover: hover) and (pointer: fine) and (min-width: 821px)";
const LERP = 0.18;

export function useCursor(
  root: RefObject<HTMLElement | null>,
  /** CSS-module class that turns the ring into the label ring. */
  labelRingClass: string,
) {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const lblRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = root.current;
    const dot = dotRef.current, ring = ringRef.current, lbl = lblRef.current;
    if (!host || !dot || !ring || !lbl) return;
    if (!window.matchMedia(DESKTOP).matches) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let raf = 0;

    const place = (el: HTMLElement, x: number, y: number) => {
      el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%)`;
    };
    place(dot, mx, my); place(lbl, mx, my);

    const onMove = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      place(dot, mx, my);
      place(lbl, mx, my);
    };

    const loop = () => {
      const f = reduced ? 1 : LERP;
      rx += (mx - rx) * f;
      ry += (my - ry) * f;
      place(ring, rx, ry);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // Delegated hover — equivalent to the reference's per-element
    // mouseenter/mouseleave on .unit, .pourbtn, .backbar, .enter, nav links, .fb
    let current: Element | null = null;
    const setHover = (el: Element | null) => {
      if (el === current) return;
      current = el;
      ring.classList.toggle(labelRingClass, !!el);
      lbl.style.opacity = el ? "1" : "0";
    };
    const onOver = (e: MouseEvent) =>
      setHover((e.target as Element | null)?.closest?.("[data-hover]") ?? null);
    const onLeaveHost = () => setHover(null);

    window.addEventListener("mousemove", onMove, { passive: true });
    host.addEventListener("mouseover", onOver);
    host.addEventListener("mouseleave", onLeaveHost);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      host.removeEventListener("mouseover", onOver);
      host.removeEventListener("mouseleave", onLeaveHost);
    };
  }, [root, labelRingClass]);

  return { dotRef, ringRef, lblRef };
}

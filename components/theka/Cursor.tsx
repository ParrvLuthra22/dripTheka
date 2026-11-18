"use client";

// Cursor — dot + lerped ring + label pill.
//
// Desktop only, and the gate is CSS, not JS: `.theka-cursor` is display:none
// unless `(hover: hover) and (pointer: fine)`, and is forced off under
// `(hover: none)` (see styles/globals.css). Touch devices never see it and
// never lose their native behaviour. JS listeners attach only on fine pointers.
//
// Colour is SURFACE-AWARE, not blended (no mix-blend-mode): the nearest
// `[data-surface]` under the pointer decides —
//   blue | ink → cream cursor      cream (default) → ink cursor
// which keeps every state inside /docs/COLOR_RULES.md.
//
// Hover API (highest priority first):
//   data-cursor-size="M"  → pill shows the size letter
//   data-hover-big        → 64px filled dot (primary CTAs)
//   data-cursor="Dekho"   → pill with action label (see lang.cursor)
//   data-hover            → 24px dot, ring folds away
//   default               → 8px dot + 40px lerped ring

import { useEffect, useRef, useState } from "react";
import { useHangoverStore } from "@/lib/store/hangover";

type Variant = "default" | "hover" | "big" | "label";
type Tone = "ink" | "cream";

const RING = 40;
const LERP = 0.15;

const TONE: Record<Tone, { fg: string; bg: string }> = {
  ink:   { fg: "var(--ink)",   bg: "var(--cream)" },
  cream: { fg: "var(--cream)", bg: "var(--ink)" },
};

function toneAt(el: Element | null): Tone {
  const surface = el?.closest<HTMLElement>("[data-surface]")?.dataset.surface;
  return surface === "blue" || surface === "ink" ? "cream" : "ink";
}

export function Cursor() {
  const dotRef   = useRef<HTMLDivElement>(null);
  const ringRef  = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  const [variant, setVariant] = useState<Variant>("default");
  const [label,   setLabel]   = useState("");
  const [tone,    setTone]    = useState<Tone>("ink");
  const [visible, setVisible] = useState(false);

  const isHungover = useHangoverStore((s) => s.isHungover);
  const hungoverRef = useRef(isHungover);
  useEffect(() => { hungoverRef.current = isHungover; }, [isHungover]);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;

    const root = document.documentElement;
    root.classList.add("theka-cursor-on");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: -100, y: -100 };
    const ring  = { x: -100, y: -100 };
    let seen = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!seen) {
        seen = true;
        ring.x = mouse.x;
        ring.y = mouse.y;
        setVisible(true);
      }
    };

    const onOver = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest) return;
      setTone(toneAt(t));

      const size = t.closest<HTMLElement>("[data-cursor-size]");
      if (size) { setVariant("label"); setLabel(size.dataset.cursorSize ?? ""); return; }
      if (t.closest("[data-hover-big]")) { setVariant("big"); setLabel(""); return; }
      const lbl = t.closest<HTMLElement>("[data-cursor]");
      if (lbl) { setVariant("label"); setLabel(lbl.dataset.cursor ?? ""); return; }
      if (t.closest("[data-hover], a, button, [role='button']")) { setVariant("hover"); setLabel(""); return; }
      setVariant("default");
      setLabel("");
    };

    const onLeave = () => { seen = false; setVisible(false); };

    const tick = () => {
      const now = performance.now();
      const wob = hungoverRef.current && !reduced;
      const wx = wob ? 2 * Math.sin((2 * Math.PI * now) / 1200) : 0;
      const wy = wob ? 2 * Math.cos((2 * Math.PI * now) / 1200) : 0;

      const f = reduced ? 1 : LERP;
      ring.x += (mouse.x - ring.x) * f;
      ring.y += (mouse.y - ring.y) * f;

      const dot = dotRef.current, rng = ringRef.current, lab = labelRef.current;
      if (dot) dot.style.transform = `translate3d(${mouse.x + wx}px, ${mouse.y + wy}px, 0)`;
      if (lab) lab.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      if (rng) rng.style.transform = `translate3d(${ring.x + wx}px, ${ring.y + wy}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("theka-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const c = TONE[tone];
  const dotSize = variant === "big" ? 64 : variant === "hover" ? 24 : 8;
  const showDot  = variant !== "label";
  const showRing = variant === "default";
  const showPill = variant === "label";

  const layer =
    "theka-cursor fixed top-0 left-0 pointer-events-none will-change-transform";
  const ease = "var(--ease-out-expo)";

  return (
    <div aria-hidden="true" style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms" }}>
      {/* Ring — lerped */}
      <div ref={ringRef} className={layer} style={{ zIndex: "var(--z-cursor)" }}>
        <div
          className="rounded-full"
          style={{
            width: RING, height: RING,
            marginLeft: -RING / 2, marginTop: -RING / 2,
            border: `1px solid ${c.fg}`,
            opacity: showRing ? 0.7 : 0,
            transform: `scale(${showRing ? 1 : 0.5})`,
            transition: `opacity 250ms, transform 350ms ${ease}, border-color 200ms`,
          }}
        />
      </div>

      {/* Dot — 1:1 */}
      <div ref={dotRef} className={layer} style={{ zIndex: "var(--z-cursor)" }}>
        <div
          className="rounded-full"
          style={{
            width: dotSize, height: dotSize,
            marginLeft: -dotSize / 2, marginTop: -dotSize / 2,
            backgroundColor: c.fg,
            opacity: showDot ? (variant === "big" ? 0.9 : 1) : 0,
            transition: `width 300ms ${ease}, height 300ms ${ease}, margin 300ms ${ease}, opacity 200ms, background-color 200ms`,
          }}
        />
      </div>

      {/* Label pill — solid, opaque, inverse of the surface */}
      <div ref={labelRef} className={layer} style={{ zIndex: "var(--z-cursor)" }}>
        <div
          className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap rounded-full px-3.5 py-[7px]"
          style={{
            backgroundColor: c.fg,
            color: c.bg,
            transform: `translate(-50%, -50%) scale(${showPill ? 1 : 0.7})`,
            opacity: showPill ? 1 : 0,
            transition: `opacity 200ms, transform 250ms ${ease}`,
          }}
        >
          {label || "·"}
        </div>
      </div>
    </div>
  );
}

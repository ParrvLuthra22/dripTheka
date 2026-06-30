"use client";

// Foam — global viewport-level bubble renderer.
// Mount once in /app/(site)/layout.tsx.
//
// Subscribes to useFoamStore; renders each bubble as a Framer Motion div.
// Bubbles rise from (x, y) with a slight horizontal sine-wave drift.
// 5% of bubbles "pop" mid-rise (scale to 1.4, opacity 0) instead of
// reaching the top of the viewport.
//
// Blocked routes: /login, /account, /legal — no bubbles rendered.
// prefers-reduced-motion: nothing renders (store spawn is already a no-op;
//   this component bails out as extra safety).

import { useReducedMotion, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useFoamStore, type FoamBubble } from "@/lib/store/foam";

const BLOCKED_PATHS = ["/login", "/account", "/legal"];

// ── Single bubble ─────────────────────────────────────────────────────────────

interface BubbleProps {
  bubble: FoamBubble;
  onDone: () => void;
}

function Bubble({ bubble, onDone }: BubbleProps) {
  const { x, y, size, duration, driftX, pop } = bubble;

  const style: React.CSSProperties = {
    position:        "absolute",
    left:            x,
    top:             y,
    width:           size,
    height:          size,
    marginLeft:      -size / 2, // center on x
    marginTop:       -size / 2, // center on y
    borderRadius:    "50%",
    backgroundColor: "#E4E2DD",
    boxShadow:       "inset 0 3px 7px rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.07)",
    pointerEvents:   "none",
    willChange:      "transform, opacity",
  };

  if (pop) {
    // Pop variant: expands and vanishes mid-rise
    return (
      <motion.div
        style={style}
        initial={{ y: 0, x: 0, scale: 0.8, opacity: 0.85 }}
        animate={{
          y:       [0, "-26vh"],
          x:       [0, driftX * 0.4],
          scale:   [0.8, 1.4],
          opacity: [0.85, 0],
        }}
        transition={{ duration: duration * 0.38, ease: "easeOut", times: [0, 1] }}
        onAnimationComplete={onDone}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      style={style}
      initial={{ y: 0, x: 0, scale: 0.8, opacity: 0.85 }}
      animate={{
        y:       [0, "-22vh", "-52vh", "-96vh"],
        x:       [0, driftX * 0.3, driftX, driftX * 0.5],
        scale:   [0.8, 1.0, 1.06, 0.55],
        opacity: [0.85, 0.78, 0.42, 0],
      }}
      transition={{ duration, ease: "easeOut", times: [0, 0.28, 0.62, 1] }}
      onAnimationComplete={onDone}
      aria-hidden="true"
    />
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export function Foam() {
  const prefersReduced = useReducedMotion();
  const pathname       = usePathname();
  const bubbles        = useFoamStore((s) => s.bubbles);
  const removeBubble   = useFoamStore((s) => s.removeBubble);

  // Don't render on blocked routes or when motion is reduced
  if (prefersReduced) return null;
  if (BLOCKED_PATHS.some((p) => pathname?.startsWith(p))) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        pointerEvents: "none",
        // z-45: above page content, below nav (z-50), below modals (z-200)
        zIndex:        45,
        overflow:      "hidden",
      }}
    >
      {bubbles.map((b) => (
        <Bubble key={b.id} bubble={b} onDone={() => removeBubble(b.id)} />
      ))}
    </div>
  );
}

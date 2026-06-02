"use client";

// PourTransition — Barba-style "pour in / pour out" route transition.
//
// On every pathname change:
//   Desktop (> 768px):
//     1. Cream overlay sweeps DOWN from top  (0 → 700ms)
//     2. Wordmark fades in at peak           (600 → 800ms)
//     3. New page has rendered behind overlay
//     4. Overlay sweeps DOWN off-screen      (800 → 1500ms)
//
//   Mobile (≤ 768px):
//     Simple 300ms opacity fade — no layout shift risk.
//
// The overlay is positioned OUTSIDE <main> so it sits above Nav/Footer.
// Children always render — we never block hydration.

import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

// Ease: cubic-bezier(.6,.05,.2,1) — same as --ease-pour
const EASE_POUR = [0.6, 0.05, 0.2, 1] as const;
const EASE_EXPO = [0.16, 1,   0.3, 1] as const;

// Desktop timing (ms → s for Framer)
const D_IN   = 0.68;  // overlay sweeps in
const D_HOLD = 0.16;  // hold at peak (wordmark visible)
const D_OUT  = 0.68;  // overlay sweeps out
const D_TOTAL = D_IN + D_HOLD + D_OUT; // ≈ 1.52s

// keyframe time fractions  [0, in, in+hold, total] / total
const T0  = 0;
const T1  = D_IN / D_TOTAL;
const T2  = (D_IN + D_HOLD) / D_TOTAL;
const T3  = 1;

// ── Desktop overlay ───────────────────────────────────────────────────────

function DesktopOverlay({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      key="pour-overlay"
      className={[
        "fixed inset-0 z-[80] bg-[--cream]",
        "flex items-center justify-center",
        "pointer-events-none will-change-transform",
      ].join(" ")}
      // Keyframe: off-screen top → cover → off-screen bottom
      initial={{ y: "-100%" }}
      animate={{ y: ["-100%", "0%", "0%", "100%"] }}
      transition={{
        duration: D_TOTAL,
        times:    [T0, T1, T2, T3],
        ease:     [EASE_POUR, "linear", EASE_EXPO],
      } as Parameters<typeof motion.div>[0]["transition"]}
      onAnimationComplete={onDone}
    >
      {/* Wordmark at peak — fades in then out */}
      <motion.span
        aria-hidden="true"
        className="font-display italic text-[--ink] select-none"
        style={{ fontSize: "clamp(1.75rem, 4vw, 3.5rem)" }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{
          duration: D_TOTAL,
          times: [0, T1 * 0.8, T1, T2, T2 + 0.08],
          ease: "easeInOut",
        }}
      >
        Drip Theka
      </motion.span>
    </motion.div>
  );
}

// ── Mobile overlay ────────────────────────────────────────────────────────

function MobileOverlay({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      key="pour-overlay-mobile"
      className="fixed inset-0 z-[80] bg-[--cream] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 0.32, times: [0, 0.55, 1], ease: "easeOut" }}
      onAnimationComplete={onDone}
    />
  );
}

// ── PourTransition wrapper ────────────────────────────────────────────────

interface PourTransitionProps {
  children: ReactNode;
}

export function PourTransition({ children }: PourTransitionProps) {
  const pathname = usePathname();

  const prevPathname = useRef(pathname);
  // Increment to remount overlay on each transition
  const [overlayKey, setOverlayKey] = useState(0);
  const [overlayActive, setOverlayActive] = useState(false);
  // Detect mobile once on client — default false for SSR
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches;
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;

    setOverlayKey((k) => k + 1);
    setOverlayActive(true);
  }, [pathname]);

  const handleDone = useCallback(() => {
    setOverlayActive(false);
  }, []);

  return (
    <>
      {/* Children always in DOM — overlay sits above them */}
      {children}

      <AnimatePresence>
        {overlayActive &&
          (isMobileRef.current ? (
            <MobileOverlay key={overlayKey} onDone={handleDone} />
          ) : (
            <DesktopOverlay key={overlayKey} onDone={handleDone} />
          ))}
      </AnimatePresence>
    </>
  );
}

"use client";

// PourTransition — route/section transition.
//
// One clean, flat PURE #004AAD screen covers the viewport on navigation, with
// the "DRIP THEKA" wordmark centred in cream. No spinner, no bar, no gradient,
// no grain, no glow — deliberately flat solid blue.
//
// Timing:
//   desktop         → cover ~350ms, brief hold, uncover ~450ms (~1s total)
//   mobile          → same, slightly faster (~700ms total)
//   reduced-motion  → instant solid-blue fade (150ms in/out), wordmark shown

import {
  useEffect, useRef, useState, useCallback, type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const BLUE = "#004AAD";
const EASE_IN  = [0.6, 0.05, 0.2, 1] as const;  // cover
const EASE_OUT = [0.16, 1, 0.3, 1] as const;    // uncover

function Wordmark() {
  return (
    <motion.span
      className="type-tanker-lg select-none"
      style={{ letterSpacing: "-0.01em", color: "#E4E2DD" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: [0, 1, 1, 0], y: [8, 0, 0, -4] }}
      transition={{ duration: 0.9, times: [0, 0.35, 0.7, 1], ease: "easeInOut" }}
    >
      DRIP THEKA
    </motion.span>
  );
}

function Overlay({ onDone, mobile, reduced }: {
  onDone: () => void; mobile: boolean; reduced: boolean;
}) {
  if (reduced) {
    return (
      <motion.div
        className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none"
        style={{ backgroundColor: BLUE }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 0.3, times: [0, 0.5, 0.5, 1], ease: "linear" }}
        onAnimationComplete={onDone}
      >
        <span className="type-tanker-lg select-none" style={{ letterSpacing: "-0.01em", color: "#E4E2DD" }}>
          DRIP THEKA
        </span>
      </motion.div>
    );
  }

  // Cover from bottom, hold, uncover upward — flat blue slab.
  const D = mobile ? 0.7 : 1.0;
  const T = mobile ? [0, 0.4, 0.55, 1] : [0, 0.35, 0.5, 1];

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-center justify-center pointer-events-none will-change-transform"
      style={{ backgroundColor: BLUE }}
      initial={{ y: "100%" }}
      animate={{ y: ["100%", "0%", "0%", "-100%"] }}
      transition={{ duration: D, times: T, ease: [EASE_IN, "linear", EASE_OUT] as never }}
      onAnimationComplete={onDone}
    >
      <Wordmark />
    </motion.div>
  );
}

export function PourTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const prevPathname = useRef(pathname);
  const [overlayKey, setOverlayKey] = useState(0);
  const [overlayActive, setOverlayActive] = useState(false);
  const isMobileRef  = useRef(false);
  const isReducedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    isMobileRef.current  = window.matchMedia("(max-width: 768px)").matches;
    isReducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;
    setOverlayKey((k) => k + 1);
    setOverlayActive(true);
  }, [pathname]);

  const handleDone = useCallback(() => setOverlayActive(false), []);

  return (
    <>
      {children}
      <AnimatePresence>
        {overlayActive && (
          <Overlay
            key={overlayKey}
            onDone={handleDone}
            mobile={isMobileRef.current}
            reduced={isReducedRef.current}
          />
        )}
      </AnimatePresence>
    </>
  );
}

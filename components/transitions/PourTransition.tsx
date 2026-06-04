"use client";

// PourTransition — path-aware route transitions.
//
// Each route type gets a distinct visual flavour:
//
//   /product/*    → Cream curtain drops from top (classic pour)
//   /pour/*       → Cobalt flood from bottom (poured into a glass)
//   /regulars     → Cobalt flood from bottom (same energy)
//   /story        → Horizontal wipe left (turning a page)
//   /building/*   → Vertical stack reveal (cards fan in)
//   /cart         → Scale + opacity (the pint grows)
//   everything else → Default cream sweep
//
//   Mobile: always 300ms opacity fade

import {
  useEffect, useRef, useState, useCallback, type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const EASE_POUR = [0.6, 0.05, 0.2, 1] as const;
const EASE_EXPO = [0.16, 1,   0.3, 1] as const;

function getVariant(path: string) {
  if (path.startsWith("/product/"))  return "product";
  if (path.startsWith("/pour/"))     return "pour";
  if (path === "/regulars")          return "regulars";
  if (path === "/story")             return "story";
  if (path.startsWith("/building"))  return "building";
  if (path === "/cart")              return "cart";
  return "default";
}

function DesktopOverlay({ onDone, toPath }: { onDone: () => void; toPath: string }) {
  const variant = getVariant(toPath);

  // Shared duration
  const D = 1.38;
  const T = [0, 0.45, 0.54, 1];

  if (variant === "pour" || variant === "regulars") {
    // Cobalt flood from bottom
    return (
      <motion.div
        className="fixed inset-0 z-[80] pointer-events-none will-change-transform"
        style={{ backgroundColor: "#004AAD" }}
        initial={{ y: "100%" }}
        animate={{ y: ["100%", "0%", "0%", "-100%"] }}
        transition={{ duration: D, times: T, ease: [EASE_EXPO, "linear", EASE_POUR] as never }}
        onAnimationComplete={onDone}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: D, times: [0, T[0]+0.3, T[1], T[2], T[2]+0.08], ease: "easeInOut" }}
        >
          <Image src="/dtlogo-cropped.png" alt="" width={480} height={192}
            style={{ height: "clamp(2rem, 5vh, 4rem)", width: "auto", opacity: 0.9 }} />
        </motion.div>
      </motion.div>
    );
  }

  if (variant === "story") {
    // Horizontal wipe left
    return (
      <motion.div
        className="fixed inset-0 z-[80] bg-[--cream] pointer-events-none will-change-transform"
        initial={{ x: "100%" }}
        animate={{ x: ["100%", "0%", "0%", "-100%"] }}
        transition={{ duration: D, times: T, ease: [EASE_EXPO, "linear", EASE_POUR] as never }}
        onAnimationComplete={onDone}
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: D, times: [0, T[0]+0.3, T[1], T[2], T[2]+0.08] }}
        >
          <span className="font-display italic text-[--ink]/40 select-none"
            style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)" }}>
            The Story.
          </span>
        </motion.div>
      </motion.div>
    );
  }

  if (variant === "product") {
    // Cream curtain from top — classic pour
    return (
      <motion.div
        className="fixed inset-0 z-[80] bg-[--cream] flex items-center justify-center pointer-events-none will-change-transform"
        initial={{ y: "-100%" }}
        animate={{ y: ["-100%", "0%", "0%", "100%"] }}
        transition={{ duration: D, times: T, ease: [EASE_POUR, "linear", EASE_EXPO] as never }}
        onAnimationComplete={onDone}
      >
        <motion.span
          className="font-mono text-[9px] uppercase tracking-[0.18em] text-[--ink]/50 select-none"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ duration: D, times: [0, T[0]+0.3, T[1], T[2], T[2]+0.08] }}
        >
          Pour #001
        </motion.span>
      </motion.div>
    );
  }

  if (variant === "cart") {
    // Scale + fade
    return (
      <motion.div
        className="fixed inset-0 z-[80] bg-[--cream] flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [1.04, 1, 1, 0.97] }}
        transition={{ duration: 0.9, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
        onAnimationComplete={onDone}
      />
    );
  }

  // Default: cream sweep down
  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-[--cream] flex items-center justify-center pointer-events-none will-change-transform"
      initial={{ y: "-100%" }}
      animate={{ y: ["-100%", "0%", "0%", "100%"] }}
      transition={{ duration: D, times: T, ease: [EASE_POUR, "linear", EASE_EXPO] as never }}
      onAnimationComplete={onDone}
    >
      <motion.div
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: D, times: [0, T[0]+0.3, T[1], T[2], T[2]+0.08] }}
      >
        <Image src="/dtlogo-cropped.png" alt="" width={480} height={192}
          style={{ height: "clamp(1.5rem, 4vh, 3rem)", width: "auto", opacity: 0.85 }} />
      </motion.div>
    </motion.div>
  );
}

function MobileOverlay({ onDone }: { onDone: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[80] bg-[--cream] pointer-events-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 0.32, times: [0, 0.55, 1], ease: "easeOut" }}
      onAnimationComplete={onDone}
    />
  );
}

export function PourTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const prevPathname = useRef(pathname);
  const [overlayKey, setOverlayKey] = useState(0);
  const [overlayActive, setOverlayActive] = useState(false);
  // Store the destination path so the overlay variant matches
  const [toPath, setToPath] = useState(pathname);
  const isMobileRef = useRef(false);

  useEffect(() => {
    isMobileRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches;
  }, []);

  useEffect(() => {
    if (pathname === prevPathname.current) return;
    prevPathname.current = pathname;
    setToPath(pathname);
    setOverlayKey((k) => k + 1);
    setOverlayActive(true);
  }, [pathname]);

  const handleDone = useCallback(() => setOverlayActive(false), []);

  return (
    <>
      {children}
      <AnimatePresence>
        {overlayActive &&
          (isMobileRef.current ? (
            <MobileOverlay key={overlayKey} onDone={handleDone} />
          ) : (
            <DesktopOverlay key={overlayKey} onDone={handleDone} toPath={toPath} />
          ))}
      </AnimatePresence>
    </>
  );
}

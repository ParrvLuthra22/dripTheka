"use client";

// HangoverMode — idle-detection easter egg.
//
// After `idleMs` (default 5 min) of zero interaction:
//   • Adds `.is-hungover` to <body> (Cursor.tsx reads this for wobble, CSS can too)
//   • Sets hangover store → PintGlass foam goes flat
//   • After another `idleMs` in hangover, shows "you good?" toast
//
// ANY interaction (mousemove, scroll, touch, keydown, focus) immediately
// cancels hangover and restarts the idle countdown.

import { useHydrated } from "@/lib/theka/hooks";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useHangoverStore } from "@/lib/store/hangover";
import { track } from "@/lib/analytics";

const INTERACTION_EVENTS = [
  "mousemove",
  "scroll",
  "touchstart",
  "keydown",
] as const;

interface HangoverModeProps {
  idleMs?: number; // default 5 min
}

export function HangoverMode({ idleMs = 300_000 }: HangoverModeProps) {
  const { setHungover } = useHangoverStore();
  const [toastVisible, setToastVisible] = useState(false);
  const mounted = useHydrated();

  const isHungoverRef  = useRef(false);
  const idleTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetAt    = useRef(0);

  // All state mutation goes through these helpers so refs + store + DOM stay in sync.
  function enterHangover() {
    isHungoverRef.current = true;
    setHungover(true);
    document.body.classList.add("is-hungover");
    track({ name: "hangover_entered" });
    // Show toast after another idleMs in hangover
    toastTimer.current = setTimeout(() => setToastVisible(true), idleMs);
  }

  function exitHangover() {
    if (!isHungoverRef.current) return;
    isHungoverRef.current = false;
    setHungover(false);
    document.body.classList.remove("is-hungover");
    setToastVisible(false);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
  }

  function scheduleHangover() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(enterHangover, idleMs);
  }

  function handleInteraction() {
    const now = Date.now();

    if (isHungoverRef.current) {
      exitHangover();
      track({ name: "hangover_recovered" });
    }

    // Throttle timer resets to once per 500ms — mousemove fires continuously
    if (now - lastResetAt.current > 500) {
      lastResetAt.current = now;
      scheduleHangover();
    }
  }

  useEffect(() => {
    scheduleHangover();

    const opts = { passive: true } as const;
    INTERACTION_EVENTS.forEach((evt) =>
      document.addEventListener(evt, handleInteraction, opts)
    );
    // focus uses capture so it catches focusin on any element
    document.addEventListener("focus", handleInteraction, { passive: true, capture: true });

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      INTERACTION_EVENTS.forEach((evt) =>
        document.removeEventListener(evt, handleInteraction)
      );
      document.removeEventListener("focus", handleInteraction, true);
      document.body.classList.remove("is-hungover");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {toastVisible && (
        <motion.div
          key="hangover-toast"
          role="alertdialog"
          aria-modal="false"
          aria-label="You've been idle a while"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 right-6 z-[250] flex flex-col gap-3"
          style={{
            backgroundColor: "#141518",
            padding: "16px 18px",
            maxWidth: 272,
          }}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#E4E2DD]">
            you good? need water?
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                track({ name: "hangover_dismissed_yes" });
                window.location.reload();
              }}
              className="flex-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#E4E2DD]/60 border border-[#E4E2DD]/20 py-2 hover:border-[#E4E2DD]/60 hover:text-[#E4E2DD] transition-colors"
            >
              yes, refresh
            </button>
            <button
              onClick={() => {
                track({ name: "hangover_dismissed_no" });
                exitHangover();
                scheduleHangover();
              }}
              className="flex-1 font-mono text-[8px] uppercase tracking-[0.12em] text-[#E4E2DD]/60 border border-[#E4E2DD]/20 py-2 hover:border-[#E4E2DD]/60 hover:text-[#E4E2DD] transition-colors"
            >
              stop being weird
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

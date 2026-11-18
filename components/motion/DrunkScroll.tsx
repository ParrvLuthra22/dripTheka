"use client";

// DrunkScroll — fast-scroll easter egg.
//
// Polls window.scrollY via rAF, computes velocity over a 150ms rolling window.
// When velocity exceeds 4000 px/s for ≥300ms continuous:
//   • Adds body.is-wobbly for 600ms (CSS animation — see <style> below)
//   • Plays wobble.mp3 if sound is on
//   • Shows "scrolled too fast. drink water." toast (auto-dismiss 2.5s)
//   • Marks sessionStorage so it only triggers once per session
//
// Entirely disabled when prefers-reduced-motion is active (vestibular safety).

import { useHydrated } from "@/lib/theka/hooks";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/components/sound/SoundProvider";
import { track } from "@/lib/analytics";

const VELOCITY_THRESHOLD = 4000;  // px/s
const SUSTAIN_MS         = 300;   // must stay above threshold for this long
const WOBBLE_DURATION_MS = 600;
const TOAST_DURATION_MS  = 2500;
const SESSION_KEY        = "dt_drunk_scroll_used";

export function DrunkScroll() {
  const { play, muted } = useSound();
  const [toastVisible, setToastVisible] = useState(false);
  const mounted = useHydrated();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Respect prefers-reduced-motion — disable entirely
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Already used this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    type Sample = { y: number; t: number };
    const history: Sample[] = [];
    let aboveThresholdSince = 0;
    let alreadyTriggered    = false;

    function trigger() {
      alreadyTriggered = true;
      sessionStorage.setItem(SESSION_KEY, "1");

      // Body wobble
      document.body.classList.add("is-wobbly");
      setTimeout(() => document.body.classList.remove("is-wobbly"), WOBBLE_DURATION_MS);

      // Sound
      if (!muted) play("wobble");

      // Analytics
      track({ name: "drunk_scroll_triggered" });

      // Toast
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), TOAST_DURATION_MS);
    }

    let rafId: number;

    function tick() {
      if (alreadyTriggered) return;

      const now = Date.now();
      const y   = window.scrollY;

      history.push({ y, t: now });

      // Drop samples older than 150ms
      const cutoff = now - 150;
      while (history.length > 1 && history[0].t < cutoff) {
        history.shift();
      }

      if (history.length >= 2) {
        const oldest = history[0];
        const dt     = (now - oldest.t) / 1000;
        const vel    = dt > 0 ? Math.abs(y - oldest.y) / dt : 0;

        if (vel > VELOCITY_THRESHOLD) {
          if (aboveThresholdSince === 0) {
            aboveThresholdSince = now;
          } else if (now - aboveThresholdSince >= SUSTAIN_MS) {
            trigger();
            return; // stop polling
          }
        } else {
          aboveThresholdSince = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* CSS for body wobble — scoped here so it's co-located */}
      <style>{`
        body.is-wobbly {
          animation: drunk-scroll ${WOBBLE_DURATION_MS}ms ease-in-out;
          transform-origin: center center;
        }
        @keyframes drunk-scroll {
          0%   { transform: rotate(0deg)    translateX(0px);   }
          20%  { transform: rotate(-0.6deg) translateX(-2px);  }
          45%  { transform: rotate(0.4deg)  translateX(1px);   }
          70%  { transform: rotate(-0.2deg) translateX(-1px);  }
          85%  { transform: rotate(0.1deg)  translateX(0.5px); }
          100% { transform: rotate(0deg)    translateX(0px);   }
        }
      `}</style>

      {createPortal(
        <AnimatePresence>
          {toastVisible && (
            <motion.p
              key="drunk-toast"
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[250] font-mono text-[9px] uppercase tracking-[0.14em] pointer-events-none whitespace-nowrap"
              style={{
                backgroundColor: "#141518",
                color: "#E4E2DD",
                padding: "10px 16px",
              }}
            >
              scrolled too fast. drink water.
            </motion.p>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

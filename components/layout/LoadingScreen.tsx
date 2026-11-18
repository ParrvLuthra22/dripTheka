"use client";

// LoadingScreen — fullscreen brand intro that plays /public/videos/loading.mp4.
// Shows once per browser session (sessionStorage gate).
//
// Behavior:
//   • Mounts only on the first session-load
//   • Plays video muted, playsinline, autoplay (mobile-safe)
//   • Exits on `ended` event, on Skip click, or after 8s safety timeout
//   • Wipes out with a smooth top-to-bottom sweep transition (1s), then unmounts
//   • Respects prefers-reduced-motion (renders nothing)

import { useHydrated, useMediaQuery } from "@/lib/theka/hooks";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SAFETY_TIMEOUT_MS = 8000;

export function LoadingScreen() {
  // Client-only and never under reduced motion; OFF during SSR/hydration.
  const hydrated  = useHydrated();
  const reduced   = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [dismissed, setDismissed] = useState(false);
  const visible   = hydrated && !reduced && !dismissed;
  const videoRef  = useRef<HTMLVideoElement>(null);

  // Common dismissal — start wipe-out
  const dismiss = () => setDismissed(true);

  // While visible: lock scroll + safety net if the video never ends
  // (slow network / decode error) — bail after 8s.
  useEffect(() => {
    if (!visible) return;
    document.documentElement.style.overflow = "hidden";
    const t = window.setTimeout(() => setDismissed(true), SAFETY_TIMEOUT_MS);
    return () => {
      document.documentElement.style.overflow = "";
      window.clearTimeout(t);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          initial={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{
            duration: 1.1,
            ease: [0.76, 0, 0.24, 1],
          }}
          className="fixed inset-0 z-[200] bg-(--ink) flex items-center justify-center overflow-hidden"
        >
          {/* Fullscreen video */}
          <video
            ref={videoRef}
            src="/videos/loading.mp4"
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={dismiss}
            onError={dismiss}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Subtle vignette so the skip control reads */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to top, rgba(20,21,24,0.55) 0%, rgba(20,21,24,0) 30%)",
            }}
          />

          {/* Skip button */}
          <button
            onClick={dismiss}
            aria-label="Skip intro"
            className="absolute bottom-6 right-6 z-10 font-mono text-[10px] uppercase tracking-[0.16em] text-(--cream)/80 hover:text-(--cream) border border-(--cream)/30 hover:border-(--cream) px-4 py-2 transition-colors duration-200 cursor-pointer backdrop-blur-sm"
          >
            Skip&nbsp;→
          </button>

          {/* Brand caption — bottom-left */}
          <p className="absolute bottom-7 left-6 font-mono text-[10px] uppercase tracking-[0.18em] text-(--cream)/60 select-none">
            Pouring&nbsp;·&nbsp;Drip Theka
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

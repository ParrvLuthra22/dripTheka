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

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SAFETY_TIMEOUT_MS = 8000;

export function LoadingScreen() {
  // Default OFF — we only flip ON in useEffect once we know we're mounted
  // client-side.
  const [visible, setVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // SSR safety + reduced-motion respect
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    // Show it on initial mount (hard reload)
    setVisible(true);
    document.documentElement.style.overflow = "hidden";

    // Safety net: if the video never ends (slow network / decode error),
    // bail after 8s
    timeoutRef.current = window.setTimeout(() => dismiss(), SAFETY_TIMEOUT_MS);

    return () => {
      document.documentElement.style.overflow = "";
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  // Common dismissal — start wipe-out
  const dismiss = () => {
    if (typeof window !== "undefined") {
      document.documentElement.style.overflow = "";
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

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
          className="fixed inset-0 z-[200] bg-[--ink] flex items-center justify-center overflow-hidden"
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
            className="absolute bottom-6 right-6 z-10 font-mono text-[10px] uppercase tracking-[0.16em] text-[--cream]/80 hover:text-[--cream] border border-[--cream]/30 hover:border-[--cream] px-4 py-2 transition-colors duration-200 cursor-pointer backdrop-blur-sm"
          >
            Skip&nbsp;→
          </button>

          {/* Brand caption — bottom-left */}
          <p className="absolute bottom-7 left-6 font-mono text-[10px] uppercase tracking-[0.18em] text-[--cream]/60 select-none">
            Pouring&nbsp;·&nbsp;Drip Theka
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

// ThekaEgg — global keyboard easter egg.
//
// Type "theka" anywhere on the site (outside form fields) and a toast
// appears bottom-right. Ambient sound momentarily bumps if it's playing.
// Logged in console for the curious.

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSound } from "@/components/sound/SoundProvider";

const TARGET = "theka";

export function ThekaEgg() {
  const { muted, play } = useSound();
  const [visible, setVisible] = useState(false);

  const reveal = useCallback(() => {
    setVisible(true);
    // Subtle audio cue
    if (!muted) play("clink");
    setTimeout(() => setVisible(false), 4500);
  }, [muted, play]);

  useEffect(() => {
    let buffer = "";
    let timer: number | null = null;

    const reset = () => {
      buffer = "";
      if (timer) { window.clearTimeout(timer); timer = null; }
    };

    const onKey = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isEditable =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable;

      if (isEditable) return;

      const key = e.key.toLowerCase();
      // Only accept single-char keys (letters/digits)
      if (key.length !== 1 || !/[a-z]/.test(key)) {
        // Backspace, etc. — reset
        reset();
        return;
      }

      buffer += key;
      // Trim buffer to last N chars matching target length
      if (buffer.length > TARGET.length) {
        buffer = buffer.slice(-TARGET.length);
      }

      // Reset buffer if no progress for 1.5s
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(reset, 1500);

      if (buffer === TARGET) {
        // eslint-disable-next-line no-console
        console.log("%c🍷 welcome to the theka", "color:#004AAD;font-weight:bold;font-size:14px");
        reveal();
        reset();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (timer) window.clearTimeout(timer);
    };
  }, [reveal]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
        >
          <div
            className="relative px-6 py-4 flex flex-col items-center gap-1 max-w-[420px] text-center"
            style={{
              backgroundColor: "#141518",
              color: "#E4E2DD",
              border: "1px solid rgba(228,226,221,0.15)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
            }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#004AAD]">
              You typed the magic word
            </p>
            <p
              className="font-display italic"
              style={{ fontSize: "clamp(1.1rem, 2vw, 1.4rem)" }}
            >
              Welcome to the theka.
            </p>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4E2DD]/40 mt-0.5">
              One round on the house.
            </p>

            {/* Tiny wine glass mark in the corner */}
            <span
              className="absolute top-2 right-2 opacity-30 text-[#004AAD]"
              aria-hidden="true"
            >
              <svg width="14" height="20" viewBox="0 0 100 140" fill="none">
                <path d="M28 8 Q50 14 72 8 C88 20 92 38 86 56 C84 75 70 88 54 94 L54 122 L46 122 L46 94 C30 88 16 75 14 56 C12 38 16 20 28 8 Z"
                  stroke="currentColor" strokeWidth="6" fill="rgba(0,74,173,0.15)" strokeLinejoin="round" />
                <ellipse cx="50" cy="130" rx="20" ry="3.5" stroke="currentColor" strokeWidth="6" fill="currentColor" />
              </svg>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

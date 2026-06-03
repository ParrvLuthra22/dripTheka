"use client";

// HappyHour — Konami code easter egg.
//
// ↑ ↑ ↓ ↓ ← → ← → B A  toggles "happy-hour" mode:
//   • Adds .happy-hour class to <html>
//   • Toast bottom-right
//   • Cobalt --blue token becomes warm red (#FF4D33) globally via CSS
//   • Persists for the session (sessionStorage flag)
//
// Press Konami again to toggle off.

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSound } from "@/components/sound/SoundProvider";

const KONAMI = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
  "b", "a",
];

const SESSION_KEY = "dt-happy-hour";

function setHappyHour(active: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("happy-hour", active);
  if (active) sessionStorage.setItem(SESSION_KEY, "1");
  else        sessionStorage.removeItem(SESSION_KEY);
}

export function HappyHour() {
  const { muted, play } = useSound();
  const [toast, setToast] = useState<null | "on" | "off">(null);

  // Restore session state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) {
      document.documentElement.classList.add("happy-hour");
    }
  }, []);

  // Konami listener
  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      // Skip if user is in a form input
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isEditable) return;

      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      buffer.push(key);
      // Trim
      if (buffer.length > KONAMI.length) buffer = buffer.slice(-KONAMI.length);
      // Match
      if (buffer.length === KONAMI.length &&
          buffer.every((k, i) => k === KONAMI[i])) {
        buffer = [];
        const currentlyOn = document.documentElement.classList.contains("happy-hour");
        const next = !currentlyOn;
        setHappyHour(next);
        setToast(next ? "on" : "off");
        if (!muted) play("clink");
        setTimeout(() => setToast(null), 3500);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [muted, play]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-7 right-7 z-[100] pointer-events-none"
        >
          <div
            className="px-5 py-3 flex flex-col items-start gap-0.5"
            style={{
              backgroundColor: "#141518",
              color: "#E4E2DD",
              border: "1px solid rgba(228,226,221,0.12)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.4)",
            }}
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#FF4D33]">
              ▲▲▼▼◀▶◀▶BA
            </p>
            <p className="font-display italic text-lg leading-tight">
              {toast === "on" ? "Happy Hour. 🍷" : "Back to cobalt."}
            </p>
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#E4E2DD]/40">
              {toast === "on" ? "Drinks on the house." : "Closing tab."}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

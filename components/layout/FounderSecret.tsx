"use client";

// FounderSecret — hidden message at the very bottom of the page.
//
// When the user reaches 100% scroll position (near the footer end),
// a small message fades in from below: a personal note from the founders.
// Shows once per session. Homepage only.

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "dt-founder-secret-seen";

export function FounderSecret() {
  const pathname = usePathname();
  const [visible, setVisible]   = useState(false);
  const [revealed, setRevealed] = useState(false);
  const triggered = useRef(false);

  // Only show on homepage
  useEffect(() => {
    if (pathname !== "/") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    triggered.current = false;
    setRevealed(false);

    const onScroll = () => {
      if (triggered.current) return;
      const docH    = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docH > 0 ? window.scrollY / docH : 0;
      if (progress >= 0.995) {
        triggered.current = true;
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(true);
        setTimeout(() => setRevealed(true), 300);
        // Fade out after 8 seconds
        setTimeout(() => setVisible(false), 8500);
        window.removeEventListener("scroll", onScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: revealed ? 1 : 0, y: revealed ? 0 : 16 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
        >
          <div
            className="px-6 py-4 text-center max-w-[480px] mx-auto"
            style={{
              background: "rgba(20, 21, 24, 0.92)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(228, 226, 221, 0.08)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
            }}
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#004AAD] mb-2">
              You found the bottom.
            </p>
            <p className="font-display italic text-[#E4E2DD] leading-snug"
              style={{ fontSize: "clamp(0.85rem, 1.6vw, 1.1rem)" }}>
              &ldquo;The bar never really closes.&rdquo;
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/35 mt-2">
              — Ayaan &amp; Parrv
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

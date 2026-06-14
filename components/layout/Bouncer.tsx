"use client";

// Bouncer — 18+ age gate.
//
// The Theka is a liquor shop. We need an age gate. Compliance theatre
// is boring — ours is a brand moment.
//
// State machine:
//   "checking" → reading the cookie client-side (renders nothing)
//   "show"     → full-screen overlay visible
//   "hidden"   → overlay gone (either passed cookie or exempted path)
//
// Cookie: dt_bouncer_passed=1, max-age 30 days, sameSite=lax
// Exempt: /legal/*, /not-found (accessible without gate, for compliance)

import {
  useState, useEffect, useRef, useCallback,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { useSound }      from "@/components/sound/SoundProvider";

// ── Cookie helpers ────────────────────────────────────────────────────────

const COOKIE_NAME    = "dt_bouncer_passed";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function setBouncer() {
  document.cookie =
    `${COOKIE_NAME}=1; max-age=${COOKIE_MAX_AGE}; path=/; SameSite=Lax`;
}

function hasBouncer(): boolean {
  if (typeof document === "undefined") return true; // SSR: assume passed
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${COOKIE_NAME}=`));
}

// ── Exempt paths (accessible without age gate) ────────────────────────────

function isExempt(path: string): boolean {
  return (
    path.startsWith("/legal/") ||
    path === "/not-found"      ||
    path.startsWith("/api/")
  );
}

// ── PostHog tracker ───────────────────────────────────────────────────────

function track(event: string) {
  if (typeof window === "undefined") return;
  const ph = (window as unknown as { posthog?: { capture: (n: string) => void } }).posthog;
  ph?.capture(event);
}

// ── Headline split for stagger animation ──────────────────────────────────

const HEADLINE_CHARS = Array.from("ARE YOU 18+ ?");

// ── Component ─────────────────────────────────────────────────────────────

type Phase = "checking" | "show" | "hidden";

export function Bouncer() {
  const pathname       = usePathname();
  const { play, muted } = useSound();
  const prefersReduced = useReducedMotion();

  const [phase, setPhase]   = useState<Phase>("checking");
  const primaryRef           = useRef<HTMLButtonElement>(null);
  const secondaryRef         = useRef<HTMLButtonElement>(null);

  // ── Determine initial phase (client-side only to avoid hydration mismatch) ──
  useEffect(() => {
    if (isExempt(pathname)) {
      setPhase("hidden");
      return;
    }

    if (hasBouncer()) {
      setPhase("hidden");
    } else {
      setPhase("show");
      document.body.style.overflow = "hidden";
      track("bouncer_shown");

      // Focus primary after entrance animation
      const t = setTimeout(() => primaryRef.current?.focus(), 500);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount — pathname changes within same session don't recheck

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleEnter = useCallback(() => {
    setBouncer();
    track("bouncer_passed");
    if (!muted) play("clink");
    setPhase("hidden");
    document.body.style.overflow = "";
  }, [muted, play]);

  const handleDecline = useCallback(() => {
    track("bouncer_dismissed");
    window.location.href = "https://www.disneyplus.com";
  }, []);

  // ── Focus trap ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== "show") return;

    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = [primaryRef.current, secondaryRef.current].filter(
        Boolean
      ) as HTMLButtonElement[];
      if (focusable.length < 2) return;
      const [first, last] = [focusable[0], focusable[focusable.length - 1]];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [phase]);

  // ── Render nothing while checking ─────────────────────────────────────────

  if (phase === "checking") return null;

  // Animation helpers (inline props to avoid Framer Motion Variants type issues)
  const exitScale   = prefersReduced ? 1 : 1.02;
  const charDuration = prefersReduced ? 0.01 : 0.35;
  const charScaleFrom = prefersReduced ? 1 : 0.92;

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {phase === "show" && (
        <motion.div
          key="bouncer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bouncer-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.4 } }}
          exit={{ opacity: 0, scale: exitScale, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 flex flex-col items-center justify-center z-[300] overflow-hidden"
          style={{ backgroundColor: "#004AAD" }}
        >
          {/* Grain texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
            }}
          />

          {/* Content stack */}
          <div
            className="relative z-10 flex flex-col items-center text-center gap-6 px-6 max-w-[960px]"
            style={{ paddingInline: "var(--pad-x, 1.5rem)" }}
          >
            {/* Headline — Tanker, per-char stagger with inline props */}
            <h1
              id="bouncer-title"
              className="font-tanker text-[#E4E2DD] uppercase leading-none"
              style={{ fontSize: "clamp(4rem, 12vw, 10rem)" }}
            >
              {HEADLINE_CHARS.map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: charScaleFrom }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: charDuration, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: "inline-block" }}
                >
                  {ch === " " ? " " : ch}
                </motion.span>
              ))}
            </h1>


            {/* Subtext — Fraunces italic */}
            <motion.p
              className="font-display italic text-[#E4E2DD]/70"
              style={{ fontSize: "clamp(1rem, 2.5vw, 1.75rem)" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              the theka has rules. we don&apos;t, but legally.
            </motion.p>

            {/* ── Buttons ─────────────────────────────────────────────── */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.15, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Primary — cream fill, cobalt text */}
              <button
                ref={primaryRef}
                onClick={handleEnter}
                data-hover-big
                className="font-mono text-[11px] uppercase tracking-[0.16em] px-8 py-4 bg-[#E4E2DD] text-[#004AAD] hover:bg-[#141518] hover:text-[#E4E2DD] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#E4E2DD] focus-visible:outline-offset-3 whitespace-nowrap"
              >
                yeah, let me in
              </button>

              {/* Secondary — outline */}
              <button
                ref={secondaryRef}
                onClick={handleDecline}
                data-hover
                className="font-mono text-[11px] uppercase tracking-[0.16em] px-8 py-4 border border-[#E4E2DD]/55 text-[#E4E2DD]/80 hover:border-[#E4E2DD] hover:text-[#E4E2DD] transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[#E4E2DD] focus-visible:outline-offset-3 whitespace-nowrap"
              >
                no, take me to disney+
              </button>
            </motion.div>
          </div>

          {/* ── Bottom fine print ────────────────────────────────────── */}
          <motion.p
            className="absolute bottom-5 left-0 right-0 text-center font-mono text-[8px] uppercase tracking-[0.1em] text-[#E4E2DD]/25 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.4 }}
          >
            by entering, you confirm you&apos;re of legal drinking age in your region.
            fits aren&apos;t actually alcohol but the vibe is.
          </motion.p>

          {/* ── Wine glass watermark ──────────────────────────────────── */}
          <div
            aria-hidden="true"
            className="absolute bottom-6 right-6 pointer-events-none opacity-[0.15]"
          >
            <WineGlassMark size={56} className="text-[#E4E2DD]" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

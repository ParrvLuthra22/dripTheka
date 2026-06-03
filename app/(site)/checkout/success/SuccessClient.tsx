"use client";

// SuccessClient — the cinematic part: HeroPour replay + single foam bubble.
// The bubble drifts up from the bottom and pops at the top. Once. That's it.

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { HeroPourFallback } from "@/components/glass/HeroPour";
import { formatPrice } from "@/lib/utils/format";

const HeroPour = dynamic(
  () => import("@/components/glass/HeroPour").then((m) => ({ default: m.HeroPour })),
  { ssr: false, loading: () => <HeroPourFallback /> }
);

interface SuccessClientProps {
  orderId: string;
  deposit: number;
  balance: number;
  dropStr: string;
}

export function SuccessClient({ orderId, deposit, balance, dropStr }: SuccessClientProps) {
  // Bubble fires once after a short delay
  const [bubbleActive, setBubbleActive] = useState(false);
  const [heroDone,     setHeroDone]     = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBubbleActive(true), 1400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div data-nav-tone="light" className="min-h-screen bg-[--blue] flex flex-col items-center justify-center relative overflow-hidden py-20"
      style={{ paddingInline: "var(--pad-x)" }}>

      {/* ── Single foam bubble — drifts up, pops at top ──────────────── */}
      {bubbleActive && (
        <motion.div
          className="fixed pointer-events-none z-[100]"
          style={{
            bottom: 32,
            left: "50%",
            x: "-50%",
            width:  64,
            height: 64,
            borderRadius: "50%",
            backgroundColor: "#E4E2DD",
            border: "1px solid rgba(228,226,221,0.35)",
            boxShadow: "inset 0 8px 16px rgba(255,255,255,0.3)",
          }}
          initial={{ y: 0, scale: 1, opacity: 0 }}
          animate={{
            y:       [0, "-55vh", "-72vh", "-85vh", "-93vh"],
            scale:   [1, 1.08,    1.25,    2.0,     3.5   ],
            opacity: [0, 0.75,    0.65,    0.35,    0     ],
          }}
          transition={{
            duration: 3.2,
            times:    [0, 0.25, 0.55, 0.80, 1.0],
            ease:     "easeOut",
          }}
        />
      )}

      {/* ── HeroPour glass replay ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[300px] relative"
        style={{ height: "clamp(220px, 40vh, 380px)" }}
      >
        <HeroPour
          className="w-full h-full"
          onReady={() => setHeroDone(true)}
        />
      </motion.div>

      {/* ── Headline ─────────────────────────────────────────────────── */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="font-display italic text-[#E4E2DD] text-center mt-8"
        style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
      >
        Stool reserved.
      </motion.h1>

      {/* ── Order details (mono ticker) ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-8 w-full max-w-[480px] border border-[#E4E2DD]/15 p-6 space-y-3"
      >
        {[
          ["Order",         orderId],
          ["Deposit paid",  deposit > 0 ? formatPrice(deposit)  : "—"],
          ["Balance due",   balance > 0 ? formatPrice(balance)  : "—"],
          ["Opening Night", dropStr],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/40">
              {label}
            </span>
            <span className="font-mono text-[10px] text-[#E4E2DD]/80 text-right tabular-nums">
              {value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Subtext ───────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="font-sans text-[#E4E2DD]/50 text-center max-w-[400px] leading-relaxed mt-6"
        style={{ fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}
      >
        We&apos;ll send the Last Call when the doors open. Until then, keep an eye on your inbox.
      </motion.p>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.45 }}
        className="mt-8 flex flex-wrap gap-4 justify-center"
      >
        <Link
          href="/"
          data-hover
          className="font-mono text-[10px] uppercase tracking-[0.14em] border border-[#E4E2DD]/30 text-[#E4E2DD] px-6 py-3 hover:border-[#E4E2DD] hover:bg-[#E4E2DD] hover:text-[--blue] transition-all duration-200"
        >
          Back to the bar →
        </Link>
        <Link
          href="/regulars"
          data-hover
          className="font-mono text-[10px] uppercase tracking-[0.14em] bg-[#E4E2DD]/10 text-[#E4E2DD]/70 px-6 py-3 hover:bg-[#E4E2DD]/20 transition-all duration-200"
        >
          Join Last Call
        </Link>
      </motion.div>

      {/* Background grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] -z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

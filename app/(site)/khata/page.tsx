"use client";

// Khata page — /khata
// The running tab. Pieces you've saved but haven't poured yet.
// Reuses ProductCard — same 3D tilt, quick-add, and heart toggle.

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useKhataStore } from "@/lib/store/khata";
import { ProductCard } from "@/components/ui/ProductCard";
import { POUR_001 } from "@/data/pour-001";
import type { Product } from "@/data/pour-001";
import { copy } from "@/data/copy";

export default function KhataPage() {
  const slugs = useKhataStore((s) => s.slugs);
  const clear = useKhataStore((s) => s.clear);
  const [confirmClear, setConfirmClear] = useState(false);

  const products = slugs
    .map((slug) => POUR_001.products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  const empty = products.length === 0;

  return (
    <div data-nav-tone="dark" className="bg-[--cream] min-h-screen">
      <div style={{ paddingInline: "var(--pad-x)" }} className="py-16 md:py-24 max-w-[1400px] mx-auto">

        {/* ── Header ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-end justify-between gap-6 pb-10 mb-10 border-b border-[--ink]/10 flex-wrap"
        >
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]/30 mb-2">
              Your running tab
            </p>
            <h1
              className="font-display italic text-[--ink] leading-tight"
              style={{ fontSize: "clamp(2rem, 6vw, 4rem)" }}
            >
              The Khata.
            </h1>
          </div>

          {!empty && (
            <div className="flex items-center gap-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40 tabular-nums">
                {products.length} saved
              </p>
              <AnimatePresence mode="wait" initial={false}>
                {confirmClear ? (
                  <motion.button
                    key="confirm"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => { clear(); setConfirmClear(false); }}
                    onBlur={() => setConfirmClear(false)}
                    data-hover
                    className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--cream] bg-[--ink] px-3 py-1.5 hover:bg-red-600 transition-colors"
                  >
                    Sure? Wipe it →
                  </motion.button>
                ) : (
                  <motion.button
                    key="clear"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => setConfirmClear(true)}
                    data-hover
                    className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/60 underline decoration-dotted underline-offset-2 hover:text-red-500 hover:decoration-solid transition-colors"
                  >
                    Clear khata
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ── Empty state ──────────────────────────────────────────── */}
        {empty ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="py-24 text-center"
          >
            <p
              className="font-display italic text-[--ink]/30"
              style={{ fontSize: "clamp(1.25rem, 3vw, 2rem)" }}
            >
              Tab&apos;s empty. Suspiciously responsible of you.
            </p>
            <p className="font-mono text-[9px] uppercase tracking-widest text-[--ink]/20 mt-3">
              Tap the heart on anything you&apos;re not ready to commit to.
            </p>
            <Link
              href="/pour/pour-001"
              data-hover-big
              className="inline-block mt-8 font-mono text-[10px] uppercase tracking-[0.14em] border border-[--blue] text-[--blue] px-6 py-3 hover:bg-[--blue] hover:text-[--cream] transition-all duration-200"
            >
              {copy.cta.viewAll}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <AnimatePresence>
              {products.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  aspectRatio="aspect-[3/4]"
                  animDelay={i * 0.06}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

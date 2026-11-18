"use client";

// PourProductGrid — all products in a 3-column grid with filter + sort.
// Editorial interstitial injected after product 5.
// All filtering/sorting is client-side — no re-fetch needed.

import { useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ui/ProductCard";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";
import { BottleCap } from "@/components/ui/BottleCap";
import { POUR_001 } from "@/data/pour-001";
import type { GarmentType } from "@/data/pour-001";
import { cn } from "@/lib/utils/cn";

type FilterKey = "all" | GarmentType;
type SortKey   = "newest" | "price-asc" | "price-desc";

// Filter chips — V1 only has tees + hoodies. Others are greyed/disabled.
const FILTERS: { key: FilterKey; label: string; disabled?: boolean }[] = [
  { key: "all",    label: "All" },
  { key: "tee",    label: "Tees" },
  { key: "hoodie", label: "Hoodies" },
  { key: "cargo",  label: "Cargo",   disabled: true },
  { key: "jacket", label: "Jackets", disabled: true },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest",     label: "Newest" },
  { key: "price-asc",  label: "Price ↑" },
  { key: "price-desc", label: "Price ↓" },
];

// Editorial interstitial — full-width blue band inserted between products
function EditorialBreak() {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-3 my-2">
      <div
        data-surface="blue"
        className="relative flex items-center gap-8 md:gap-12 overflow-hidden py-14 md:py-20"
        style={{
          backgroundColor: "#004AAD",
          paddingInline:   "var(--pad-x)",
          minHeight:       "40vh",
        }}
      >
        {/* Drop number — massive, left */}
        <div className="shrink-0 hidden md:flex flex-col items-start">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#E4E2DD]/40 mb-2">
            Pour
          </span>
          <span className="font-loud uppercase text-[#E4E2DD]/85" style={{ fontSize: "clamp(6rem, 9vw, 11rem)", lineHeight: 0.82 }}>
            001
          </span>
        </div>

        {/* Quote */}
        <blockquote
          className="font-display italic text-[#E4E2DD] leading-tight max-w-[700px]"
          style={{ fontSize: "clamp(1.6rem, 4vw, 3.5rem)" }}
        >
          &ldquo;This pour is small on purpose.
          <br />
          We&apos;d rather&nbsp;
          <span className="not-italic font-display italic opacity-60">sell out</span>
          &nbsp;than&nbsp;
          <span className="text-[#E4E2DD] opacity-60">sell out</span>.&rdquo;
        </blockquote>

        {/* Decorative drop number */}
        <span
          className="absolute right-6 bottom-3 font-mono text-[120px] leading-none text-[#E4E2DD]/5 select-none pointer-events-none"
          aria-hidden="true"
        >
          001
        </span>
      </div>
    </div>
  );
}

export function PourProductGrid() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [activeSort,   setActiveSort]   = useState<SortKey>("newest");
  const filterGroupRef = useRef<HTMLDivElement>(null);

  // Arrow-key cycling through enabled filter caps
  const handleFilterKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const enabled = FILTERS.filter((f) => !f.disabled);
      const cur = enabled.findIndex((f) => f.key === activeFilter);
      const next =
        e.key === "ArrowRight" || e.key === "ArrowDown"
          ? (cur + 1) % enabled.length
          : (cur - 1 + enabled.length) % enabled.length;
      setActiveFilter(enabled[next].key);
      const radios = filterGroupRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not([disabled])'
      );
      radios?.[next]?.focus();
    },
    [activeFilter]
  );

  const products = useMemo(() => {
    let list = [...POUR_001.products];

    // Filter
    if (activeFilter !== "all") {
      list = list.filter((p) => p.type === activeFilter);
    }

    // Sort
    switch (activeSort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      // newest = original data order
    }

    return list;
  }, [activeFilter, activeSort]);

  const firstHalf  = products.slice(0, 5);
  const secondHalf = products.slice(5);

  return (
    <section
      data-nav-tone="dark"
      className="bg-(--cream) py-16 md:py-24"
      style={{ paddingInline: "var(--pad-x)" }}
      aria-label="Product grid"
    >
      {/* ── Filter + Sort controls ─────────────────────────────── */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-(--ink)/10">
        {/* Filter BottleCaps */}
        <div
          ref={filterGroupRef}
          className="flex items-center gap-2 flex-wrap"
          role="radiogroup"
          aria-label="Filter by type"
          onKeyDown={handleFilterKeyDown}
        >
          {FILTERS.map(({ key, label, disabled }) => {
            const isActive = activeFilter === key;
            const tabIdx = disabled ? -1 : isActive ? 0 : -1;

            return (
              <BottleCap
                key={key}
                label={label}
                active={isActive}
                disabled={disabled}
                onClick={() => setActiveFilter(key)}
                size="sm"
                tabIndex={tabIdx}
                ariaLabel={`${label}, ${isActive ? "active" : "inactive"}${disabled ? ", coming soon" : ""}`}
              />
            );
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="pour-sort"
            className="font-mono text-[9px] uppercase tracking-[0.12em] text-(--ink)/40"
          >
            Sort
          </label>
          <select
            id="pour-sort"
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value as SortKey)}
            className="font-mono text-[9px] uppercase tracking-[0.12em] text-(--ink) bg-transparent border border-(--ink)/20 px-2 py-1.5 focus:outline-none focus:border-(--blue) transition-colors"
          >
            {SORTS.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </Reveal>

      {/* ── Product grid ──────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeFilter}-${activeSort}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-display italic text-3xl text-(--ink)/30">Nothing here yet.</p>
              <p className="font-mono text-xs text-(--ink)/20 mt-2 uppercase tracking-widest">
                More types coming in Pour #002
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {/* First half — products 1–5 */}
              {firstHalf.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  aspectRatio="aspect-[3/4]"
                  animDelay={i * 0.06}
                />
              ))}

              {/* Editorial break after product 5 (only when enough products) */}
              {firstHalf.length >= 3 && secondHalf.length > 0 && (
                <EditorialBreak />
              )}

              {/* Second half — product 6+ */}
              {secondHalf.map((product, i) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  aspectRatio="aspect-[3/4]"
                  animDelay={i * 0.06 + 0.1}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Footer CTA ────────────────────────────────────────── */}
      <Reveal delay={160} className="mt-16 pt-8 border-t border-(--ink)/10 text-center">
        <p
          className="font-display italic text-(--ink)/60 mb-6"
          style={{ fontSize: "clamp(1.1rem, 2vw, 1.5rem)" }}
        >
          Didn&apos;t find your fit?
        </p>
        <p className="font-sans text-sm text-(--ink)/40 mb-6 max-w-[400px] mx-auto leading-relaxed">
          Join the Regulars and help shape Pour #002 — you tell us what to make next.
        </p>
        <Link
          href="/regulars"
          data-hover
          className="inline-block font-mono text-[10px] uppercase tracking-[0.14em] border border-(--blue) text-(--blue) px-6 py-3 hover:bg-(--blue) hover:text-(--cream) transition-all duration-200"
        >
          Join the Regulars →
        </Link>
      </Reveal>
    </section>
  );
}

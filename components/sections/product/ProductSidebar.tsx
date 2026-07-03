"use client";

// ProductSidebar — sticky right column on desktop, normal flow on mobile.
// Fix 07: full brand treatment — eyebrow, ChalkMark name, hangtag price,
// FabricChip colour selector, liquid-fill CTA, foam burst on add,
// and MobileStickyAddBar when CTA scrolls off screen.

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";
import { useUpsellStore } from "@/lib/store/upsell";
import { useSound } from "@/components/sound/SoundProvider";
import { useFoamStore } from "@/lib/store/foam";
import { RefillNotifyForm } from "./RefillNotifyForm";
import { MobileStickyAddBar } from "./MobileStickyAddBar";
import { WaitlistForm } from "@/components/ui/WaitlistForm";
import { BottleCap } from "@/components/ui/BottleCap";
import { FabricChip } from "@/components/ui/FabricChip";
import { PriceTag } from "@/components/ui/PriceTag";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { ThekaLabel, type ThekaKey } from "@/components/ui/ThekaLabel";
import { SizeGuideModal } from "@/components/ui/SizeGuideModal";
import { formatPrice, formatDeposit } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  POUR_001,
  isTappedOut,
} from "@/data/pour-001";
import type { Product, Size } from "@/data/pour-001";

// ── Helpers ───────────────────────────────────────────────────────────────────

// Vol number from product ID "dt-001-004" → "04"
function getVolNum(id: string): string {
  const n = parseInt(id.split("-").pop() ?? "1", 10);
  return String(n).padStart(2, "0");
}

// Product name split — wraps the garment-type word in a ChalkMark underline
function NameWithUnderline({ name, type }: { name: string; type: string }) {
  const words = name.split(/\s+/);
  const typeUpper = type.toUpperCase();
  const idx = words.findIndex((w) => w.toUpperCase().startsWith(typeUpper));
  const underlineIdx = idx >= 0 ? idx : words.length - 1;

  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 && " "}
          {i === underlineIdx ? (
            <span className="relative inline-block">
              {word}
              <ChalkMark
                variant="underline"
                color="var(--ink)"
                className="absolute -bottom-1 left-0 w-full h-[8px]"
              />
            </span>
          ) : (
            word
          )}
        </span>
      ))}
    </>
  );
}

// Mono detail list from product data
function buildDetails(product: Product): string[] {
  const fitLine  = `${product.fit.toUpperCase()} FIT`;
  const craft    =
    product.type === "hoodie" || product.type === "set"
      ? "EMBROIDERED IN DELHI"
      : "SCREEN PRINTED IN DELHI";
  return [product.fabric.toUpperCase(), fitLine, craft, "SHIPS IN ~28 DAYS POST-DROP"];
}

// Tag palette maps product IDs → language keys
const TAGS: Record<string, ThekaKey> = {
  "dt-001-001": "freshlyPoured",
  "dt-001-002": "happyHour",
  "dt-001-003": "freshlyPoured",
  "dt-001-004": "lastRound",
  "dt-001-005": "tappedOut",
  "dt-001-006": "freshlyPoured",
};

type AddState = "idle" | "adding" | "poured";

// Framer fade props reused for AnimatePresence labels
const fade = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  exit:       { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

// ── Component ─────────────────────────────────────────────────────────────────

interface ProductSidebarProps {
  product: Product;
}

export function ProductSidebar({ product }: ProductSidebarProps) {
  const { addItem, updateQuantity } = useCartStore();
  const { muted, play }             = useSound();
  const spawnFoam                   = useFoamStore((s) => s.spawn);

  const tappedOut = isTappedOut(product.sizes);
  const tagKey: ThekaKey = TAGS[product.id] ?? "freshlyPoured";
  const details = buildDetails(product);
  const volNum  = getVolNum(product.id);

  const availableSizes = product.sizes.filter((s) => s.stock > 0);

  const [selectedSize,     setSelectedSize]     = useState<Size | null>(availableSizes[0]?.size ?? null);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [qty,              setQty]              = useState(1);
  const [addState,         setAddState]         = useState<AddState>("idle");
  const [sizeGuideOpen,    setSizeGuideOpen]    = useState(false);
  const [ctaVisible,       setCtaVisible]       = useState(true);

  const sizeGroupRef  = useRef<HTMLDivElement>(null);
  const ctaRef        = useRef<HTMLButtonElement>(null);
  const ctaSentinelRef = useRef<HTMLDivElement>(null);

  const selectedColorName = product.colorNames[selectedColorIdx] ?? product.colorNames[0];

  // Record for "Recently Viewed" row
  useEffect(() => {
    useRecentlyViewedStore.getState().record(product.slug);
  }, [product.slug]);

  // IntersectionObserver — hide/show mobile sticky bar when CTA scrolls off
  useEffect(() => {
    const sentinel = ctaSentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, []);

  // Arrow-key cycling for radiogroup keyboard nav
  const handleSizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
      e.preventDefault();
      const avail = product.sizes.filter((s) => s.stock > 0).map((s) => s.size);
      if (!avail.length) return;
      const cur  = selectedSize ? avail.indexOf(selectedSize) : 0;
      const next =
        e.key === "ArrowRight" || e.key === "ArrowDown"
          ? (cur + 1) % avail.length
          : (cur - 1 + avail.length) % avail.length;
      setSelectedSize(avail[next]);
      const radios = sizeGroupRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="radio"]:not([disabled])'
      );
      radios?.[next]?.focus();
    },
    [product.sizes, selectedSize]
  );

  // ── Add to cart ────────────────────────────────────────────────────────────
  const handleAdd = useCallback(() => {
    if (!selectedSize || tappedOut) return;
    setAddState("adding");

    addItem(product, selectedSize, selectedColorName);
    if (qty > 1) updateQuantity(product.id, selectedSize, qty);

    if (!muted) play("clink");

    // Foam burst from the CTA button position
    const rect = ctaRef.current?.getBoundingClientRect();
    if (rect) {
      spawnFoam({ x: rect.left + rect.width / 2, y: rect.top, count: 3, source: "cart-add" });
    }

    setAddState("poured");
    setTimeout(() => setAddState("idle"), 1800);
    setTimeout(() => useUpsellStore.getState().show(product.slug), 900);
  }, [selectedSize, selectedColorName, tappedOut, qty, product, addItem, updateQuantity, muted, play, spawnFoam]);

  const showStickyBar = !ctaVisible && !tappedOut;

  return (
    <>
      <div
        className={cn(
          "flex flex-col gap-6 px-6 md:px-8 py-8",
          "md:sticky md:top-[--header-h] md:max-h-[calc(100vh-var(--header-h))] md:overflow-y-auto",
          "md:border-l md:border-[--ink]/8",
        )}
      >
        {/* ── 1. Eyebrow row ──────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <ThekaLabel
            k={tappedOut ? "tappedOut" : tagKey}
            as="span"
            showHi={false}
            hairline={false}
            className={cn(
              "px-2.5 py-1 text-[8px]",
              tappedOut
                ? "bg-[#3D0000] text-[#FF7070]"
                : "bg-[--ink] text-[--cream]"
            )}
          />
          <div className="flex items-center gap-2">
            <ThekaLabel k="pour001" color="ink" hairline={false} showHi={false} as="span" />
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/25">
              VOL.&nbsp;{volNum}&nbsp;·&nbsp;DROP&nbsp;001
            </span>
          </div>
        </div>

        {/* ── 2. Product name with ChalkMark underline ────────────── */}
        <div className="space-y-1">
          <h1
            className="font-display italic font-semibold text-[--ink] leading-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            <NameWithUnderline name={product.name} type={product.type} />
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/30">
            {product.type} · {product.fit} fit
          </p>
        </div>

        {/* ── 3. PriceTag hangtag ─────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 pt-2">
            {/* Rotate extra so string visibly extends up-left */}
            <div style={{ transform: "rotate(-6deg)", transformOrigin: "21% 34%" }}>
              <PriceTag price={product.price} size="md" />
            </div>
          </div>
          {!tappedOut && (
            <p className="font-mono text-[9px] text-[--blue] tracking-[0.1em]">
              {formatDeposit(product.price)} deposit · 70% on Opening Night
            </p>
          )}
        </div>

        {/* ── 4. Description ──────────────────────────────────────── */}
        <div className="border-t border-[--ink]/8 pt-5 space-y-3">
          <p
            className="font-display italic text-[--ink]/80 leading-relaxed"
            style={{ fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)", lineHeight: 1.45 }}
          >
            {product.tagline}
          </p>
          <ul className="space-y-1.5">
            {details.map((detail) => (
              <li key={detail} className="flex items-center gap-2">
                <span className="block w-1 h-1 rounded-full bg-[--blue] shrink-0" aria-hidden="true" />
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/45">
                  {detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {!tappedOut && (
          <>
            {/* ── 5. Size selector ──────────────────────────────────── */}
            <div className="space-y-3 border-t border-[--ink]/8 pt-5">
              <div className="flex items-center justify-between">
                <ThekaLabel k="sizeSelector" color="ink" hairline={false} showHi />
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  data-hover
                  className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--blue] hover:text-[--ink] transition-colors underline decoration-dotted"
                  aria-label="Open size guide"
                >
                  Size Guide
                </button>
              </div>

              <div
                ref={sizeGroupRef}
                className="flex flex-wrap gap-2 sm:gap-3"
                role="radiogroup"
                aria-label="Select size"
                onKeyDown={handleSizeKeyDown}
              >
                {product.sizes.map(({ size, stock }) => {
                  const avail    = stock > 0;
                  const selected = selectedSize === size;
                  const isFirst  = availableSizes[0]?.size === size;
                  const tabIdx   = avail
                    ? selected || (!selectedSize && isFirst) ? 0 : -1
                    : -1;

                  return (
                    <BottleCap
                      key={size}
                      label={size}
                      active={selected}
                      disabled={!avail}
                      onClick={() => setSelectedSize(size)}
                      size="md"
                      tabIndex={tabIdx}
                      ariaLabel={`Size ${size}, ${selected ? "active" : "inactive"}${!avail ? ", out of stock" : ""}`}
                    />
                  );
                })}
              </div>

              {!selectedSize && (
                <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest">
                  Select a size to continue
                </p>
              )}
            </div>

            {/* ── 6. Colour selector ────────────────────────────────── */}
            <div className="space-y-3">
              <ThekaLabel k="colorSelector" color="ink" hairline={false} showHi />
              <div
                className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1"
                role="radiogroup"
                aria-label="Select colour"
              >
                {product.colors.map((hex, i) => (
                  <FabricChip
                    key={hex}
                    color={hex}
                    colorName={product.colorNames[i] ?? ""}
                    active={selectedColorIdx === i}
                    onClick={() => setSelectedColorIdx(i)}
                    tabIndex={selectedColorIdx === i ? 0 : -1}
                  />
                ))}
              </div>
            </div>

            {/* ── 7. Quantity stepper ───────────────────────────────── */}
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40">
                Quantity
              </p>
              <div
                className="flex items-center border border-[--ink]/20 w-fit"
                role="group"
                aria-label="Quantity"
              >
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  className="w-10 h-10 flex items-center justify-center font-mono text-base text-[--ink] hover:bg-[--ink]/5 transition-colors disabled:opacity-30"
                >
                  −
                </button>
                <span
                  className="w-10 h-10 flex items-center justify-center font-mono text-sm text-[--ink] tabular-nums border-x border-[--ink]/20"
                  aria-live="polite"
                >
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  aria-label="Increase quantity"
                  className="w-10 h-10 flex items-center justify-center font-mono text-base text-[--ink] hover:bg-[--ink]/5 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* ── 8. Primary CTA (liquid fill) ──────────────────────── */}
            {/* Sentinel div observed by IntersectionObserver for sticky bar */}
            <div ref={ctaSentinelRef} className="space-y-3">
              <button
                ref={ctaRef}
                onClick={handleAdd}
                disabled={!selectedSize || addState === "adding"}
                data-hover-big
                className={cn(
                  "relative w-full py-[18px] font-mono text-xs uppercase tracking-[0.18em]",
                  "bg-[--blue] border border-[--ink] overflow-hidden",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue] focus-visible:ring-offset-2",
                  !selectedSize
                    ? "text-[--cream]/40 cursor-not-allowed"
                    : "text-[--cream]"
                )}
              >
                {/* Cream liquid fill — rises on adding, stays on poured */}
                <motion.span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 pointer-events-none"
                  initial={false}
                  animate={{ height: addState !== "idle" ? "100%" : "0%" }}
                  transition={
                    addState === "adding"
                      ? { duration: 0.9, ease: [0.6, 0.05, 0.2, 1] }
                      : { duration: 0 }
                  }
                  style={{ backgroundColor: "#E4E2DD" }}
                />

                <AnimatePresence mode="wait">
                  {addState === "poured" ? (
                    <motion.span key="poured" {...fade} className="relative z-10 block" style={{ color: "#004AAD" }}>
                      Poured ✓
                    </motion.span>
                  ) : (
                    <motion.span key="add" {...fade} className="relative z-10 block">
                      {selectedSize
                        ? `ONE ROUND, PLEASE · ${formatPrice(product.price * qty)}`
                        : "Pick a size →"}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* ── 9. Deposit reassurance ────────────────────────────── */}
              <p className="font-mono text-[9px] text-[--ink]/30 text-center uppercase tracking-[0.12em] leading-relaxed">
                30% deposit today&nbsp;·&nbsp;70% on Opening Night&nbsp;·&nbsp;doors khulne wale hain
              </p>

              <WaitlistForm slug={product.slug} productName={product.name} />
            </div>
          </>
        )}

        {/* ── 10. Tapped Out state ──────────────────────────────────── */}
        {tappedOut && (
          <div className="space-y-5 border-t border-[--ink]/8 pt-5">
            <button
              disabled
              className="w-full py-4 font-mono text-[10px] uppercase tracking-[0.16em] bg-[--ink]/8 text-[--ink]/25 cursor-not-allowed flex items-center justify-center gap-2"
            >
              TAPPED OUT · khatam
            </button>
            <RefillNotifyForm productId={product.id} productName={product.name} />
          </div>
        )}

        {/* ── Pour number stamp ─────────────────────────────────────── */}
        <div className="pt-4 border-t border-[--ink]/8 flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/20">
            #{String(POUR_001.products.findIndex((p) => p.id === product.id) + 1).padStart(2, "0")}
            &nbsp;of&nbsp;{product.totalUnits}
          </span>
          <span className="block flex-1 h-px bg-[--ink]/8" />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/20">
            Limited
          </span>
        </div>

        {/* Spacer so content isn't hidden behind the mobile sticky bar */}
        {showStickyBar && <div className="h-20 md:hidden" />}

        <SizeGuideModal
          open={sizeGuideOpen}
          onClose={() => setSizeGuideOpen(false)}
          product={product}
        />
      </div>

      {/* ── Mobile sticky CTA ─────────────────────────────────────── */}
      <MobileStickyAddBar
        product={product}
        selectedSize={selectedSize}
        qty={qty}
        onAdd={handleAdd}
        addState={addState}
        visible={showStickyBar}
      />
    </>
  );
}

"use client";

// ProductSidebar — sticky right column on desktop, normal flow on mobile.
// Size selector → qty stepper → Add to Glass → pint fills automatically.

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { useSound } from "@/components/sound/SoundProvider";
import { RefillNotifyForm } from "./RefillNotifyForm";
import { cn } from "@/lib/utils/cn";
import {
  POUR_001,
  isTappedOut,
  getPriceDisplay,
  getDepositAmount,
} from "@/data/pour-001";
import type { Product, Size } from "@/data/pour-001";
import { copy } from "@/data/copy";
import { ThekaLabel, type ThekaKey } from "@/components/ui/ThekaLabel";

// ── Mono detail list generator ─────────────────────────────────────────────
function buildDetails(product: Product): string[] {
  const fabricLine = product.fabric.toUpperCase();
  const fitLine    = `${product.fit.toUpperCase()} FIT`;
  const craft      =
    product.type === "hoodie" || product.type === "set"
      ? "EMBROIDERED IN DELHI"
      : "SCREEN PRINTED IN DELHI";

  return [
    fabricLine,
    fitLine,
    craft,
    "SHIPS IN ~28 DAYS POST-DROP",
  ];
}

// ── Tag palette — maps product IDs → copy.language keys ──────────────────
const TAGS: Record<string, ThekaKey> = {
  "dt-001-001": "freshlyPoured",
  "dt-001-002": "happyHour",
  "dt-001-003": "freshlyPoured",
  "dt-001-004": "lastRound",
  "dt-001-005": "tappedOut",
  "dt-001-006": "freshlyPoured",
};

type AddState = "idle" | "adding" | "poured";

interface ProductSidebarProps {
  product: Product;
}

export function ProductSidebar({ product }: ProductSidebarProps) {
  const { addItem, updateQuantity } = useCartStore();
  const { muted, play } = useSound();

  const tappedOut = isTappedOut(product.sizes);
  const tagKey: ThekaKey = TAGS[product.id] ?? "freshlyPoured";
  const details   = buildDetails(product);

  const availableSizes = product.sizes.filter((s) => s.stock > 0);
  const [selectedSize, setSelectedSize] = useState<Size | null>(
    availableSizes[0]?.size ?? null   // pre-select first available
  );
  const [qty,      setQty]      = useState(1);
  const [addState, setAddState] = useState<AddState>("idle");

  // ── Add to glass ────────────────────────────────────────────────────────
  const handleAdd = useCallback(async () => {
    if (!selectedSize || tappedOut) return;
    setAddState("adding");

    // Add item with correct quantity
    addItem(product, selectedSize, product.colorNames[0]);
    if (qty > 1) {
      updateQuantity(product.id, selectedSize, qty);
    }

    // Play clink — guarded by mute inside play()
    if (!muted) play("clink");

    // Button: "Pour into Glass" → "Poured ✓" → back to idle
    setAddState("poured");
    setTimeout(() => setAddState("idle"), 1800);
  }, [selectedSize, tappedOut, qty, product, addItem, updateQuantity, muted, play]);

  return (
    <div
      className={cn(
        "flex flex-col gap-6 px-6 md:px-8 py-8",
        "md:sticky md:top-[--header-h] md:max-h-[calc(100vh-var(--header-h))] md:overflow-y-auto",
        // Subtle border separating the two columns on desktop
        "md:border-l md:border-[--ink]/8",
      )}
    >
      {/* ── Tag pill — sidebar version with full Hinglish gloss ──── */}
      <div>
        <ThekaLabel
          k={tappedOut ? "tappedOut" : tagKey}
          as="span"
          showHi={true}
          hairline={false}
          className={cn(
            "px-2.5 py-1 text-[8px]",
            tappedOut
              ? "bg-[#3D0000] text-[#FF7070]"
              : "bg-[--ink] text-[--cream]"
          )}
        />
      </div>

      {/* ── Product name ─────────────────────────────────────────── */}
      <div className="space-y-1">
        <h1
          className="font-display italic text-[--ink] leading-tight"
          style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)" }}
        >
          {product.name}
        </h1>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/35">
          Pour #{product.dropNumber} · {product.type}
        </p>
      </div>

      {/* ── Price ────────────────────────────────────────────────── */}
      <div className="space-y-0.5">
        <p
          className="font-mono text-[--ink] tabular-nums"
          style={{ fontSize: "clamp(1.2rem, 2vw, 1.6rem)" }}
        >
          {getPriceDisplay(product.price)}
        </p>
        {!tappedOut && (
          <p className="font-mono text-[9px] text-[--blue] tracking-[0.1em]">
            {getPriceDisplay(getDepositAmount(product.price))} deposit · 70% on Opening Night
          </p>
        )}
      </div>

      {/* ── Short description ─────────────────────────────────────── */}
      <p
        className="font-display italic text-[--ink]/65 leading-snug border-t border-[--ink]/8 pt-5"
        style={{ fontSize: "clamp(0.95rem, 1.6vw, 1.15rem)" }}
      >
        {product.tagline}
      </p>

      {/* ── Mono detail list ──────────────────────────────────────── */}
      <ul className="space-y-1.5">
        {details.map((detail) => (
          <li key={detail} className="flex items-center gap-2">
            <span className="block w-1 h-1 rounded-full bg-[--blue] shrink-0" aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/50">
              {detail}
            </span>
          </li>
        ))}
      </ul>

      {!tappedOut && (
        <>
          {/* ── Size selector ───────────────────────────────────────── */}
          <div className="space-y-2 border-t border-[--ink]/8 pt-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/40">
                Size
              </p>
              <button
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--blue] hover:text-[--ink] transition-colors underline decoration-dotted"
                aria-label="Open size guide"
              >
                Size Guide
              </button>
            </div>

            {/* Chip grid — fixed dimensions prevent layout shift */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Select size"
            >
              {product.sizes.map(({ size, stock }) => {
                const available = stock > 0;
                const selected  = selectedSize === size;

                return (
                  <button
                    key={size}
                    onClick={() => available && setSelectedSize(size)}
                    disabled={!available}
                    aria-pressed={selected}
                    aria-label={`Size ${size}${!available ? " — out of stock" : ""}`}
                    className={cn(
                      // Fixed dimensions — no layout shift on selection
                      "min-w-[52px] h-10 px-2",
                      "font-mono text-[10px] uppercase tracking-[0.1em]",
                      "border transition-all duration-150",
                      !available
                        ? "border-[--ink]/10 text-[--ink]/20 cursor-not-allowed line-through"
                        : selected
                        ? "border-[--blue] bg-[--blue] text-[--cream]"
                        : "border-[--ink]/25 text-[--ink] hover:border-[--blue] hover:text-[--blue]"
                    )}
                  >
                    {size}
                  </button>
                );
              })}
            </div>

            {!selectedSize && (
              <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-widest">
                Select a size to continue
              </p>
            )}
          </div>

          {/* ── Quantity stepper ──────────────────────────────────────── */}
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
                className="w-10 h-10 flex items-center justify-center font-mono text-base text-[--ink] hover:bg-[--ink]/5 transition-colors disabled:opacity-30"
                disabled={qty <= 1}
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

          {/* ── Primary CTA ───────────────────────────────────────────── */}
          <div className="space-y-3">
            <button
              onClick={handleAdd}
              disabled={!selectedSize || addState === "adding"}
              data-hover-big
              className={cn(
                "w-full py-4 font-mono text-[10px] uppercase tracking-[0.16em]",
                "transition-all duration-300 relative overflow-hidden",
                !selectedSize
                  ? "bg-[--ink]/10 text-[--ink]/30 cursor-not-allowed"
                  : addState === "poured"
                  ? "bg-[--blue] text-[--cream]"
                  : "bg-[--ink] text-[--cream] hover:bg-[--blue]"
              )}
            >
              <AnimatePresence mode="wait">
                {addState === "poured" ? (
                  <motion.span
                    key="poured"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    Poured ✓
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="block"
                  >
                    {selectedSize ? copy.cta.reserve : "Pick a size"}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Deposit reassurance */}
            <p className="font-mono text-[9px] text-[--ink]/30 text-center uppercase tracking-[0.12em] leading-relaxed">
              30% deposit charged today&nbsp;·&nbsp;70% on Opening Night
            </p>
          </div>
        </>
      )}

      {/* ── Tapped Out state ──────────────────────────────────────── */}
      {tappedOut && (
        <div className="space-y-5 border-t border-[--ink]/8 pt-5">
          {/* Disabled CTA */}
          <button
            disabled
            className="w-full py-4 font-mono text-[10px] uppercase tracking-[0.16em] bg-[--ink]/8 text-[--ink]/25 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <ThekaLabel k="tappedOut" as="span" hairline={false} showHi={true} color="ink" className="text-[--ink]/25" />
          </button>

          {/* Secondary CTA — refill notify */}
          <RefillNotifyForm
            productId={product.id}
            productName={product.name}
          />
        </div>
      )}

      {/* ── Pour number stamp ─────────────────────────────────────── */}
      <div className="pt-4 border-t border-[--ink]/8 flex items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/20">
          #{String(
            POUR_001.products.findIndex((p) => p.id === product.id) + 1
          ).padStart(2, "0")}&nbsp;of&nbsp;{product.totalUnits}
        </span>
        <span className="block flex-1 h-px bg-[--ink]/8" />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/20">
          Limited
        </span>
      </div>
    </div>
  );
}

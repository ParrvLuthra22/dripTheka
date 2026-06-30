"use client";

// UpsellModal — Fix 06 rebuild.
// "One more before you go" — highest-leverage conversion screen.
// Custom 3-card grid (not ProductCard), cobalt-flip hover, PriceTag hangtags,
// BottleCap stickers, DripHeart khata saves, foam burst on add.

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useUpsellStore } from "@/lib/store/upsell";
import { useCartStore } from "@/lib/store/cart";
import { useKhataStore } from "@/lib/store/khata";
import { useFoamStore } from "@/lib/store/foam";
import { useSound } from "@/components/sound/SoundProvider";
import { POUR_001, isTappedOut, getAvailableSizes } from "@/data/pour-001";
import type { Product } from "@/data/pour-001";
import { copy } from "@/data/copy";
import { DripCloseIcon } from "@/components/icons/DripCloseIcon";
import { DripHeartIcon } from "@/components/icons/DripHeartIcon";
import { Grain } from "@/components/ui/Grain";
import { Sticker } from "@/components/ui/Sticker";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";
import { ThekaLabel } from "@/components/ui/ThekaLabel";
import { PriceTag } from "@/components/ui/PriceTag";
import { BottleCap } from "@/components/ui/BottleCap";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { cn } from "@/lib/utils/cn";

// ── UpsellCard ────────────────────────────────────────────────────────────────

interface UpsellCardProps {
  product: Product;
  onAdd: (product: Product, btnEl: HTMLElement | null) => void;
}

function UpsellCard({ product, onAdd }: UpsellCardProps) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const saved       = useKhataStore((s) => s.slugs.includes(product.slug));
  const khataToggle = useKhataStore((s) => s.toggle);

  const garmentColor   = product.colors[0];
  const isLightGarment = garmentColor === "#E4E2DD";
  // Hover: card bg flips to the garment's primary color (use 2nd if cream)
  const hoverBg       = isLightGarment ? (product.colors[1] ?? "#141518") : garmentColor;
  // Default illustration: garment color on cream bg
  const defaultPrimary = isLightGarment ? (product.colors[1] ?? "#141518") : garmentColor;

  const available = getAvailableSizes(product.sizes);
  const firstSize = available[0];

  return (
    <div className="flex flex-col">
      {/* ── Card face ──────────────────────────────────────────────── */}
      <motion.div
        className="relative border border-[--ink]"
        style={{ aspectRatio: "3/4" }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        animate={{
          backgroundColor: hovered ? hoverBg : "#E4E2DD",
          rotate: hovered ? 1 : 0,
        }}
        transition={{ duration: 0.35, ease: [0.6, 0.05, 0.2, 1] }}
      >
        {/* Illustration — two layers cross-fade on hover */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-5"
            animate={{ opacity: hovered ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <ProductIllustration
              type={product.type}
              primaryColor={defaultPrimary}
              accentColor="#E4E2DD"
              className="w-full h-full"
            />
          </motion.div>
          <motion.div
            className="absolute inset-0 flex items-center justify-center p-5"
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProductIllustration
              type={product.type}
              primaryColor="#E4E2DD"
              accentColor={hoverBg}
              className="w-full h-full"
            />
          </motion.div>
        </div>

        {/* Tag pill — top left */}
        <motion.span
          className="absolute top-2 left-2 z-[2] font-mono text-[8px] uppercase tracking-[0.12em] px-1.5 py-[3px]"
          animate={{
            backgroundColor: hovered ? "#E4E2DD" : "#141518",
            color: hovered ? "#141518" : "#E4E2DD",
          }}
          transition={{ duration: 0.3 }}
        >
          {product.type}
        </motion.span>

        {/* DripHeart — bottom right, save to khata */}
        <button
          type="button"
          aria-label={
            saved
              ? `Remove ${product.name} from khata`
              : `Save ${product.name} for next round`
          }
          className="absolute bottom-2 right-2 z-[2] p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue] focus-visible:ring-offset-1"
          onClick={() => khataToggle(product.slug)}
        >
          <DripHeartIcon filled={saved} size={16} />
        </button>

        {/* PriceTag hangtag — peeks above / right of card */}
        <div className="absolute -top-2 -right-2 z-10">
          <PriceTag price={product.price} size="sm" />
        </div>

        {/* BottleCap sticker — peeks below / left of card, decorative */}
        {firstSize && (
          <span aria-hidden="true" className="absolute -bottom-3 -left-3 z-10">
            <BottleCap
              label={firstSize.size}
              active
              size="sm"
              soundOnHover={false}
              tabIndex={-1}
            />
          </span>
        )}
      </motion.div>

      {/* Name — mt-8 clears the BottleCap (32px below card face) */}
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/60 mt-8 mb-2 px-0.5 truncate">
        {product.name}
      </p>

      {/* Per-card CTA */}
      <button
        ref={btnRef}
        type="button"
        disabled={!firstSize}
        onClick={() => onAdd(product, btnRef.current)}
        className={cn(
          "w-full font-mono text-[10px] uppercase tracking-[0.16em] py-3",
          "bg-[--blue] text-[--cream] border border-[--ink]",
          "hover:bg-[--ink] transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue]",
          "disabled:opacity-40 disabled:cursor-not-allowed"
        )}
      >
        ONE ROUND, PLEASE →
      </button>
    </div>
  );
}

// ── UpsellModal ───────────────────────────────────────────────────────────────

const FOCUSABLE_SEL =
  'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function UpsellModal() {
  const router      = useRouter();
  const open        = useUpsellStore((s) => s.open);
  const excludeSlug = useUpsellStore((s) => s.excludeSlug);
  const hide        = useUpsellStore((s) => s.hide);
  const addToCart   = useCartStore((s) => s.addItem);
  const spawnFoam   = useFoamStore((s) => s.spawn);
  const { play }    = useSound();

  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const related = POUR_001.products
    .filter((p) => p.slug !== excludeSlug && !isTappedOut(p.sizes))
    .slice(0, 3);

  // Escape key, body scroll lock, initial focus on close button
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") hide(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, hide]);

  // Focus trap — cycles within the panel, skips aria-hidden children
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SEL)).filter(
        (el) => !el.closest('[aria-hidden="true"]') && el.offsetParent !== null
      );
      if (!els.length) return;
      const first = els[0];
      const last  = els[els.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onTab);
    return () => document.removeEventListener("keydown", onTab);
  }, [open]);

  // Foam — 1 slow bubble drifts past the headline on open
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      const rect = titleRef.current?.getBoundingClientRect();
      if (rect) {
        spawnFoam({
          x:        rect.left + rect.width / 2,
          y:        rect.bottom,
          count:    1,
          source:   "modal-headline",
          duration: 5,
        });
      }
    }, 320);
    return () => clearTimeout(id);
  }, [open, spawnFoam]);

  const handleAdd = useCallback(
    (product: Product, btnEl: HTMLElement | null) => {
      const available = getAvailableSizes(product.sizes);
      const firstSize = available[0];
      if (!firstSize) return;
      addToCart(product, firstSize.size, product.colorNames[0]);
      play("clink");
      const rect = btnEl?.getBoundingClientRect() ?? null;
      if (rect) {
        spawnFoam({ x: rect.left + rect.width / 2, y: rect.top, count: 3, source: "cart-add" });
      }
      hide();
    },
    [addToCart, play, spawnFoam, hide]
  );

  return (
    <AnimatePresence>
      {open && (
        // Outer layer — backdrop fade
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[--ink]/60 backdrop-blur-sm"
            onClick={hide}
            aria-hidden="true"
          />

          {/* Panel wrapper — scale + fade entrance, allows sticker to overhang */}
          <motion.div
            className="relative w-full max-w-[1100px]"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Freshly-poured sticker — springs in 150ms after panel */}
            <motion.div
              className="absolute -top-6 -right-6 z-20 pointer-events-none max-sm:hidden"
              aria-hidden="true"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: 1, rotate: -8 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 280, damping: 14 }}
            >
              <Sticker variant="freshly-poured" rotate={0} size={64} />
            </motion.div>

            {/* ── Dialog panel ─────────────────────────────────────────── */}
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="upsell-title"
              className="relative bg-[--cream] border border-[rgba(20,21,24,0.12)] rounded max-h-[90vh] overflow-y-auto p-7 md:p-14"
              style={{ boxShadow: "0 32px 64px -16px rgba(20,21,24,0.45)" }}
            >
              <Grain opacity={0.04} />

              {/* Close — first in DOM = first in tab cycle */}
              <button
                ref={closeRef}
                type="button"
                onClick={hide}
                aria-label="Close modal, keep what's in your glass"
                data-hover
                className="absolute top-4 right-4 z-10 w-9 h-9 flex items-center justify-center text-[--ink]/40 hover:text-[--ink] hover:rotate-90 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue]"
              >
                <DripCloseIcon size={24} />
              </button>

              {/* ── Header ───────────────────────────────────────────────── */}
              <header className="mb-8 md:mb-10 pr-12">
                <ThekaLabel k="beforeYouBounce" color="ink" className="mb-3" />
                <h2
                  ref={titleRef}
                  id="upsell-title"
                  className="font-display italic font-semibold text-[--ink] leading-tight mb-3"
                  style={{ fontSize: "clamp(2.25rem, 5vw, 4rem)" }}
                >
                  One more before you{" "}
                  <span className="relative inline-block whitespace-nowrap">
                    go.
                    <ChalkMark
                      variant="underline"
                      color="var(--ink)"
                      className="absolute -bottom-1 left-0 w-full h-[10px]"
                    />
                  </span>
                </h2>
                <p className="font-sans text-sm text-[--ink]/50 mb-3">
                  {copy.upsell.subtitle}
                </p>
                <HandText size="sm" rotate={-4} color="var(--ink)" className="opacity-40">
                  (low-key the smart move)
                </HandText>
              </header>

              {/* ── Product cards ─────────────────────────────────────────── */}
              {related.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 md:gap-x-10 mb-10 md:mb-12">
                  {related.map((product) => (
                    <UpsellCard key={product.id} product={product} onAdd={handleAdd} />
                  ))}
                </div>
              )}

              {/* ── Footer CTAs ───────────────────────────────────────────── */}
              {/* flex-col-reverse: mobile stacks SETTLE on top, DOM keeps keep-browsing first for tab order */}
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={hide}
                  data-hover
                  className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] py-3.5 border border-[--ink] text-[--ink] hover:bg-[--ink] hover:text-[--cream] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--blue]"
                >
                  ← keep browsing
                </button>
                <button
                  type="button"
                  onClick={() => { hide(); router.push("/checkout"); }}
                  data-hover-big
                  className="flex-1 font-mono text-[10px] uppercase tracking-[0.16em] py-3.5 bg-[--blue] text-[--cream] border border-[--ink] hover:bg-[--ink] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--blue]"
                >
                  SETTLE THE BILL →
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

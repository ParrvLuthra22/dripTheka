"use client";

// Shared ProductCard — used in CurrentlyPouring (home) and PourProductGrid (pour page).
// Includes 3D perspective tilt on hover (cursor drives rotateX/Y), a Khata
// (wishlist) toggle, and true quick-add: tap ADD → pick a size → it flies
// into the nav pint glass.

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { TappedOutStamp } from "@/components/glass/TappedOutStamp";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { isTappedOut, POUR_001 } from "@/data/pour-001";
import type { Product, Size } from "@/data/pour-001";
import { copy } from "@/data/copy";
import { ThekaLabel, type ThekaKey } from "@/components/ui/ThekaLabel";
import { PriceTag } from "@/components/ui/PriceTag";
import { BottleCap } from "@/components/ui/BottleCap";
import { useKhataStore } from "@/lib/store/khata";
import { useCartStore } from "@/lib/store/cart";
import { useToastStore } from "@/lib/store/toast";
import { useUpsellStore } from "@/lib/store/upsell";
import { useSound } from "@/components/sound/SoundProvider";
import { flyToCart } from "@/lib/utils/flyToCart";
import { pickRandom } from "@/lib/utils/copy";

// Theka-language tag palette — maps product IDs → copy.language keys
// Tag pills use showHi={false}: Hinglish makes them too wide on mobile
const TAGS: Record<string, ThekaKey> = {
  "dt-001-001": "freshlyPoured",
  "dt-001-002": "happyHour",
  "dt-001-003": "freshlyPoured",
  "dt-001-004": "lastRound",
  "dt-001-005": "tappedOut",
  "dt-001-006": "freshlyPoured",
};

// ── Heart icon — outline (Khata empty) / filled (Khata saved) ──────────────
function HeartIcon({ filled }: { filled: boolean }) {
  const d =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  return (
    <motion.svg
      key={filled ? "on" : "off"}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 16 }}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d={d}
        fill={filled ? "var(--blue)" : "none"}
        stroke={filled ? "var(--blue)" : "var(--ink)"}
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

interface ProductCardProps {
  product: Product;
  aspectRatio?: string;
  animDelay?: number;
  /** Show the "anything else?" upsell modal after a quick-add. Default true. */
  triggerUpsell?: boolean;
}

export function ProductCard({
  product,
  aspectRatio = "aspect-[3/4]",
  animDelay   = 0,
  triggerUpsell = true,
}: ProductCardProps) {
  const router     = useRouter();
  const tappedOut  = isTappedOut(product.sizes);
  const tagKey: ThekaKey = TAGS[product.id] ?? "freshlyPoured";
  const primary    = product.colors[0];
  const accent     = product.colors[1] ?? "#E4E2DD";
  const productNum = POUR_001.products.findIndex((p) => p.id === product.id) + 1;

  const inKhata     = useKhataStore((s) => s.slugs.includes(product.slug));
  const toggleKhata = useKhataStore((s) => s.toggle);
  const addItem     = useCartStore((s) => s.addItem);
  const { play, muted } = useSound();

  const availableSizes = product.sizes.filter((s) => s.stock > 0);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [justAdded,  setJustAdded]  = useState(false);
  const addBtnRef   = useRef<HTMLButtonElement>(null);
  const pickerRef   = useRef<HTMLDivElement>(null);

  // Close the size picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (pickerRef.current?.contains(e.target as Node)) return;
      setPickerOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [pickerOpen]);

  // ── 3D tilt on hover ───────────────────────────────────────────────────
  const imgRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = imgRef.current;
    if (!el || tappedOut) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5..0.5
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    // Subtle tilt — 6° max in either axis
    el.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
  }, [tappedOut]);

  const onMouseLeave = useCallback(() => {
    const el = imgRef.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  }, []);

  const handleClick = () => {
    if (!tappedOut) router.push(`/product/${product.slug}`);
  };

  // ── Quick add ────────────────────────────────────────────────────────
  const pushToast = useToastStore((s) => s.push);

  const quickAdd = useCallback((size: Size) => {
    addItem(product, size, product.colorNames[0]);
    if (!muted) play("pour");
    flyToCart(addBtnRef.current);
    pushToast(`${pickRandom(copy.cart.addedToast)} · ${product.name} (${size})`, "blue");
    setPickerOpen(false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
    if (triggerUpsell) {
      setTimeout(() => useUpsellStore.getState().show(product.slug), 900);
    }
  }, [addItem, product, muted, play, pushToast, triggerUpsell]);

  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (justAdded) return;
    if (availableSizes.length <= 1) {
      if (availableSizes[0]) quickAdd(availableSizes[0].size);
      return;
    }
    setPickerOpen((v) => !v);
  }, [availableSizes, justAdded, quickAdd]);

  const handleKhataToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const willAdd = !inKhata;
    toggleKhata(product.slug);
    if (!muted) play("cap");
    pushToast(
      willAdd ? `Saved · ${product.name}` : `Removed from khata · ${product.name}`
    );
  }, [toggleKhata, product.slug, product.name, inKhata, muted, play, pushToast]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-48px" }}
      transition={{ duration: 0.55, delay: animDelay, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div
        role={tappedOut ? "presentation" : "button"}
        tabIndex={tappedOut ? -1 : 0}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        aria-label={tappedOut ? `${product.name} — Tapped Out` : `View ${product.name}`}
        data-hover={!tappedOut || undefined}
        data-cursor={!tappedOut ? "view" : undefined}
        className={cn(
          "flex flex-col",
          tappedOut ? "cursor-not-allowed" : "cursor-pointer"
        )}
      >
        {/* ── Illustration area — 3D tilt on hover ─────────────────── */}
        <div
          ref={imgRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className={cn(
            "relative overflow-hidden",
            aspectRatio,
            tappedOut && "[filter:grayscale(1)_brightness(0.8)]"
          )}
          style={{
            backgroundColor: primary,
            transformStyle: "preserve-3d",
            transition: "transform 0.45s cubic-bezier(.2,.9,.3,1)",
            willChange: "transform",
          }}
        >
          {/* Garment SVG */}
          <div className="absolute inset-0 flex items-center justify-center p-[8%] transition-transform duration-500 ease-out group-hover:scale-[1.06]">
            <ProductIllustration
              type={product.type}
              primaryColor={primary}
              accentColor={accent}
              className="w-full h-full"
            />
          </div>

          {/* Tapped Out watermark — typographic stamp */}
          {tappedOut && <TappedOutStamp />}

          {/* Tag pill — top left; rotates on hover. showHi=false: too wide on mobile */}
          <div className="absolute top-3 left-3 z-10">
            <ThekaLabel
              k={tappedOut ? "tappedOut" : tagKey}
              as="span"
              showHi={false}
              hairline={false}
              color={tappedOut ? "cream" : "cream"}
              className={cn(
                "px-2 py-1",
                "transition-transform duration-300 group-hover:rotate-[-2deg]",
                tappedOut
                  ? "bg-[#3D0000] text-[#FF7070]"
                  : "bg-[--ink]/80 text-[--cream]"
              )}
            />
          </div>

          {/* Price — top right, hangtag */}
          {!tappedOut && (
            <div className="absolute top-3 right-3 z-10">
              <PriceTag price={product.price} size="sm" />
            </div>
          )}

          {/* Khata (wishlist) toggle — bottom right */}
          <button
            onClick={handleKhataToggle}
            data-hover
            aria-pressed={inKhata}
            aria-label={inKhata ? `Remove ${product.name} from your khata` : `Save ${product.name} to your khata`}
            className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-full bg-[--cream]/90 backdrop-blur-sm flex items-center justify-center border border-[--ink]/10 shadow-sm hover:scale-110 active:scale-95 transition-transform duration-200"
          >
            <AnimatePresence mode="wait" initial={false}>
              <HeartIcon filled={inKhata} />
            </AnimatePresence>
          </button>
        </div>

        {/* ── Metadata ──────────────────────────────────────────── */}
        <div className="pt-2.5 space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/35">
            {String(productNum).padStart(2, "0")}&nbsp;/&nbsp;
            {product.type}s&nbsp;·&nbsp;
            {isTappedOut(product.sizes)
              ? "Tapped Out"
              : product.sizes.filter((s) => s.stock > 0).map((s) => s.size).join(" – ")}
          </p>

          <p
            className={cn(
              "font-display italic text-[--ink] leading-tight",
              "relative inline-block",
              !tappedOut && [
                "after:absolute after:bottom-0 after:left-0",
                "after:h-px after:w-full after:bg-[--ink]",
                "after:scale-x-0 after:origin-left",
                "after:transition-transform after:duration-300",
                "group-hover:after:scale-x-100",
              ].join(" "),
              tappedOut && "opacity-40 line-through"
            )}
            style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.15rem)" }}
          >
            {product.name}
          </p>

          {!tappedOut && (
            <div className="relative flex items-center justify-end mt-4">
              {/* Size picker popover — opens above the ADD button */}
              <AnimatePresence>
                {pickerOpen && (
                  <motion.div
                    ref={pickerRef}
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full right-0 mb-2 z-20 flex flex-wrap justify-end gap-1.5 bg-[--cream] border-2 border-black p-2.5 shadow-[2px_2px_0_0_#141518] max-w-[210px]"
                  >
                    {availableSizes.map(({ size }) => (
                      <BottleCap
                        key={size}
                        label={size}
                        size="sm"
                        onClick={() => quickAdd(size)}
                        ariaLabel={`Add size ${size} to glass`}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                ref={addBtnRef}
                onClick={handleAddClick}
                whileTap={{ scale: 0.94 }}
                aria-expanded={availableSizes.length > 1 ? pickerOpen : undefined}
                data-cursor="add"
                className={cn(
                  "font-mono text-[10px] uppercase tracking-[0.14em] px-4 py-2 border-2 border-black transition-all",
                  justAdded
                    ? "bg-[--blue] text-[--cream] shadow-[0px_0px_0_0_#141518] translate-x-[2px] translate-y-[2px]"
                    : "bg-[--neon] text-black shadow-[2px_2px_0_0_#141518] hover:shadow-[0px_0px_0_0_#141518] hover:translate-x-[2px] hover:translate-y-[2px]"
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {justAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="block"
                    >
                      Poured ✓
                    </motion.span>
                  ) : (
                    <motion.span
                      key="add"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="block"
                    >
                      {availableSizes.length > 1 ? `${copy.cta.addToGlass} →` : copy.cta.addToGlass}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

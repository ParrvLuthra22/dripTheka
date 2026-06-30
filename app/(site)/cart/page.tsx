"use client";

// Cart page — /cart
// Hero pint glass morphs FROM the floating indicator via layoutId="cart-glass".
// PintGlass returns null on this route; this component takes over the layoutId.

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import { CountUp }     from "@/components/motion/CountUp";
import { DROP_DATE } from "@/data/pour-001";
import { ProductIllustration } from "@/components/sections/ProductIllustration";
import { PriceTag } from "@/components/ui/PriceTag";
import { cn } from "@/lib/utils/cn";
import { copy } from "@/data/copy";
import { getCartMessage } from "@/lib/utils/copy";
import { useToastStore } from "@/lib/store/toast";
import { Sticker } from "@/components/ui/Sticker";

// ── 3D tilt on hover — thumbnail (no refs needed, uses currentTarget) ───────
function onThumbMove(e: React.MouseEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width  - 0.5;
  const y = (e.clientY - rect.top)  / rect.height - 0.5;
  el.style.transform = `perspective(600px) rotateX(${-y * 16}deg) rotateY(${x * 20}deg) scale(1.06)`;
}
function onThumbLeave(e: React.MouseEvent<HTMLDivElement>) {
  e.currentTarget.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)";
}

// ── viewBox constants matching PintGlass (0 0 72 96) ─────────────────────────
const BOWL_BOT_Y = 84;
const BOWL_H     = 70;
const FOAM = [
  { cx: 36, rx: 14, ry: 4.5 },
  { cx: 19, rx:  7, ry:  3  },
  { cx: 53, rx:  7, ry:  3  },
  { cx: 27, rx:  5, ry: 2.5 },
  { cx: 46, rx:  5, ry: 2.5 },
  { cx: 36, rx:  3, ry:  2  },
];

// ── Large pint SVG (scales to any container size) ─────────────────────────────
function HeroPint({ fillLevel, tipped }: { fillLevel: number; tipped?: boolean }) {
  const liquidY = BOWL_BOT_Y - fillLevel * BOWL_H;
  const liquidH = BOWL_BOT_Y - liquidY;

  return (
    <svg
      viewBox="0 0 72 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width:  "100%",
        height: "100%",
        transform: tipped ? "rotate(-85deg)" : undefined,
        transition: "transform 0.5s cubic-bezier(.16,1,.3,1)",
        overflow: "visible",
      }}
      role="img"
      aria-label="Cart pint glass"
    >
      <defs>
        <clipPath id="hero-bowl">
          <path d="M 8 14 C 8 30 10 52 12 72 C 14 82 14 86 14 88 L 58 88 C 58 86 58 82 60 72 C 62 52 64 30 64 14 Q 36 22 8 14 Z" />
        </clipPath>
      </defs>

      {/* Liquid */}
      {fillLevel > 0 && (
        <rect x="7" y={liquidY} width="58" height={liquidH}
          fill="var(--blue, #004AAD)" clipPath="url(#hero-bowl)" />
      )}

      {/* Foam */}
      {fillLevel > 0 && (
        <g clipPath="url(#hero-bowl)">
          {FOAM.map((b, i) => (
            <ellipse key={i} cx={b.cx} cy={liquidY - b.ry / 2}
              rx={b.rx} ry={b.ry}
              fill="var(--cream, #E4E2DD)" opacity={0.88 - i * 0.06} />
          ))}
        </g>
      )}

      {/* Spilled foam ellipses when tipped */}
      {tipped && (
        <g transform="translate(-30, 20) rotate(85, 36, 48)">
          {[0, 1, 2].map((i) => (
            <ellipse key={i} cx={36 - i * 22} cy={94 + i * 8}
              rx={14 - i * 3} ry={5 - i} fill="var(--cream, #E4E2DD)" opacity={0.6 - i * 0.18} />
          ))}
        </g>
      )}

      {/* Glass outline */}
      <path d="M 4 10 A 34 7 0 0 1 68 10 C 68 26 64 50 62 72 C 60 82 60 86 60 90 L 60 92 L 12 92 L 12 90 C 12 86 12 82 10 72 C 8 50 4 26 4 10 Z"
        stroke="var(--ink, #141518)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 8 12 Q 36 20 64 12"
        stroke="var(--ink, #141518)" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M 60 34 Q 70 34 70 44 Q 70 54 60 54"
        stroke="var(--ink, #141518)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ── Formatters ────────────────────────────────────────────────────────────────

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

// ── Cart page ─────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, totalFull, totalDeposit } =
    useCartStore();
  const pushToast = useToastStore((s) => s.push);
  const count = totalItems();
  const fill  = Math.min(1, count / 10);
  const empty = items.length === 0;

  const handleRemove = (item: (typeof items)[number]) => {
    removeItem(item.product.id, item.size);
    pushToast(`Removed · ${item.product.name} (${item.size})`);
  };

  return (
    <div data-nav-tone="dark" className="bg-[--cream] min-h-screen">

      {/* ── Hero pint glass — layoutId="cart-glass" morphs from floating ── */}
      <div className="flex flex-col items-center justify-center py-10 bg-[--cream] border-b border-[--ink]/8">
        <motion.div
          layoutId="cart-glass"
          // Framer interpolates size/position from wherever the floating pint was
          transition={{ type: "spring", stiffness: 180, damping: 26 }}
          className="relative"
          style={{ width: "min(180px, 28vw)", height: "40vh", maxHeight: 380 }}
        >
          <HeroPint fillLevel={fill} tipped={empty} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="font-display italic text-[--ink] text-center mt-6"
          style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}
        >
          {getCartMessage(count)}
        </motion.h1>

        {empty && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.45 }}
            className="mt-4 text-center space-y-3"
          >
            <p className="font-sans text-[--ink]/50">The bar&apos;s still open.</p>
            <Link
              href="/pour/pour-001"
              data-hover
              className="inline-block font-mono text-[10px] uppercase tracking-[0.14em] border border-[--blue] text-[--blue] px-5 py-2.5 hover:bg-[--blue] hover:text-[--cream] transition-all duration-200"
            >
              {copy.cta.viewAll}
            </Link>
          </motion.div>
        )}
      </div>

      {/* ── Items + order summary ─────────────────────────────────────────── */}
      {!empty && (
        <div
          className="grid grid-cols-1 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px] gap-0"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* LEFT — cart items */}
          <div className="py-10 pr-0 md:pr-10 space-y-0 divide-y divide-[--ink]/8">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const primary = item.product.colors[0];
                const accent  = item.product.colors[1] ?? "#E4E2DD";
                return (
                  <motion.div
                    key={`${item.product.id}-${item.size}`}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="flex gap-4 py-6">
                      {/* Thumbnail — 3D tilt on hover */}
                      <div
                        onMouseMove={onThumbMove}
                        onMouseLeave={onThumbLeave}
                        className="shrink-0 rounded-sm overflow-hidden"
                        style={{
                          width: 72, height: 90, backgroundColor: primary,
                          transformStyle: "preserve-3d",
                          transition: "transform 0.4s cubic-bezier(.2,.9,.3,1)",
                          willChange: "transform",
                        }}
                      >
                        <ProductIllustration
                          type={item.product.type}
                          primaryColor={primary}
                          accentColor={accent}
                          className="w-full h-full"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <p className="font-display italic text-[--ink] leading-tight truncate">
                            {item.product.name}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/40 mt-0.5">
                            {item.size}&nbsp;·&nbsp;{item.colorName}
                          </p>
                        </div>

                        {/* Qty stepper */}
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-[--ink]/15">
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.size, item.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center font-mono text-sm text-[--ink] hover:bg-[--ink]/5 transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 h-8 flex items-center justify-center font-mono text-xs text-[--ink] border-x border-[--ink]/15 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.product.id, item.size, item.quantity + 1)
                              }
                              aria-label="Increase quantity"
                              className="w-8 h-8 flex items-center justify-center font-mono text-sm text-[--ink] hover:bg-[--ink]/5 transition-colors"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item)}
                            data-hover
                            className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/60 underline decoration-dotted underline-offset-2 hover:text-red-500 hover:decoration-solid transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Line price */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <PriceTag price={item.product.price * item.quantity} size="sm" />
                        <p className="font-mono text-[9px] text-[--blue] tabular-nums">
                          {formatPrice(item.depositAmount * item.quantity)} now
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* RIGHT — order summary (sticky on desktop) */}
          <div className="py-10 md:border-l md:border-[--ink]/8 md:pl-10">
            <div className="relative md:sticky md:top-[calc(var(--header-h)+2rem)] space-y-5">
              {/* Slapped-on sticker */}
              <Sticker variant="slap" tone="neon" rotate={8}
                className="absolute -top-5 right-0 z-10 hidden md:inline-flex">
                limited · loud
              </Sticker>

              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[--ink]/40">
                Order Summary
              </p>

              {/* Line items — values count up on mount + when cart changes */}
              <div className="space-y-2.5 border-b border-[--ink]/8 pb-5">
                <div className="flex justify-between">
                  <span className="font-sans text-sm text-[--ink]/60">Subtotal</span>
                  <CountUp
                    value={totalFull()}
                    duration={650}
                    format={formatPrice}
                    className="font-mono text-sm text-[--ink] tabular-nums"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-sm text-[--blue]">Deposit due now&nbsp;(30%)</span>
                  <CountUp
                    value={totalDeposit()}
                    duration={650}
                    format={formatPrice}
                    className="font-mono text-sm font-bold text-[--blue] tabular-nums"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-sm text-[--ink]/50">
                    Balance on Opening Night
                  </span>
                  <CountUp
                    value={totalFull() - totalDeposit()}
                    duration={650}
                    format={formatPrice}
                    className="font-mono text-sm text-[--ink]/50 tabular-nums"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="font-sans text-sm text-[--ink]/40">Shipping</span>
                  <span className="font-mono text-[10px] text-[--ink]/30 uppercase tracking-widest self-center">
                    After the drop
                  </span>
                </div>
              </div>

              {/* Opening Night date */}
              <p className="font-mono text-[9px] text-[--ink]/30 uppercase tracking-[0.12em] leading-relaxed">
                Opening Night est. {fmtDate(DROP_DATE)}
              </p>

              {/* CTA */}
              <Link
                href="/checkout"
                data-hover-big
                className="block w-full text-center font-mono text-xs uppercase tracking-[0.18em] py-5 bg-[#004AAD] text-[#E4E2DD] border-2 border-[#141518] shadow-[5px_5px_0_0_#141518] hover:shadow-[2px_2px_0_0_#141518] hover:translate-x-[3px] hover:translate-y-[3px] active:shadow-none active:translate-x-[5px] active:translate-y-[5px] transition-all duration-150"
              >
                {copy.cta.checkout}
              </Link>

              <p className="font-mono text-[9px] text-[--ink]/25 text-center uppercase tracking-[0.1em] leading-relaxed">
                30% deposit charged today
                <br />
                70% on Opening Night
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

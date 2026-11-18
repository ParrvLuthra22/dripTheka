"use client";

// ServePour — the full-screen pour overlay (#serve in the reference).
//
// Entrance (exact reference timeline):
//   overlay   opacity → 1                              .4s  power2.out
//   fit       fromTo {y:120, scale:.6, opacity:0} → 1  .9s  power3.out  (-=.1)
//   goblet    fromTo {y:40, opacity:0} → {opacity:.9}  .6s  power2.out  (-=.7)
//   info > *  {y:24, opacity:0} → in, stagger .07       .6s  power3.out  (-=.5)
// Close: overlay opacity → 0 .4s power2.in, then visibility:hidden.
// FRONT/BACK cross-fade (scaleX squash):
//   out { opacity:0, scaleX:.86 } .16s power2.in → swap image →
//   fromTo { opacity:0, scaleX:.86 } → { opacity:1, scaleX:1 } .4s power3.out
// prefers-reduced-motion → all of the above become instant.
//
// "Pour into glass" → useCartStore.addItem(product, size, colour) — the same
// call the product page makes — then the existing fly-to-cart droplet into
// the nav bag and a short "poured" confirmation on the button.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { gsap } from "gsap";
import type { Product, Size } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import { flyToCart } from "@/lib/utils/flyToCart";
import { lang } from "@/lib/theka/lang";
import { Goblet } from "./Goblet";
import { useMagnetic } from "./useMagnetic";
import s from "./bar.module.css";

const S = lang.bar.serve;
type Side = "front" | "back";

interface ServePourProps {
  /** Product being served, or null when closed. */
  product: Product | null;
  onClose: () => void;
}

function defaultSize(p: Product): Size | null {
  const inStock = p.sizes.filter((v) => v.stock > 0);
  return (inStock.find((v) => v.size === "M") ?? inStock[0])?.size ?? null;
}

function specsFor(p: Product): string[] {
  // Weight comes from product data (p.gsm) — never hardcoded.
  return [
    p.gsm ? `${p.gsm} GSM HEAVYWEIGHT` : p.type,
    `${p.fit} fit`,
    "PRINTED IN DELHI",
  ];
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ServePour({ product, onClose }: ServePourProps) {
  const rootRef  = useRef<HTMLElement>(null);
  const fitRef   = useRef<HTMLImageElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const infoRef  = useRef<HTMLDivElement>(null);
  const backRef  = useRef<HTMLButtonElement>(null);
  const pourRef  = useMagnetic<HTMLButtonElement>();

  // What's on screen. Kept after close so the fade-out shows the last fit.
  const [shown, setShown] = useState<Product | null>(product);
  const [side,  setSide]  = useState<Side>("front");
  const [size,  setSize]  = useState<Size | null>(product ? defaultSize(product) : null);
  const [poured, setPoured] = useState(false);

  // New product requested → reset view state during render (no effect setState)
  const [lastProduct, setLastProduct] = useState(product);
  if (product !== lastProduct) {
    setLastProduct(product);
    if (product) {
      setShown(product);
      setSide("front");
      setSize(defaultSize(product));
      setPoured(false);
    }
  }

  const addItem = useCartStore((st) => st.addItem);

  // ── Open / close timelines ────────────────────────────────────────────
  useLayoutEffect(() => {
    const root = rootRef.current, fit = fitRef.current, glass = glassRef.current, info = infoRef.current;
    if (!root || !fit || !glass || !info) return;

    if (!product) {
      if (root.style.visibility !== "visible") return;
      if (reducedMotion()) {
        gsap.set(root, { opacity: 0, visibility: "hidden" });
        return;
      }
      const tw = gsap.to(root, {
        opacity: 0, duration: 0.4, ease: "power2.in",
        onComplete: () => { root.style.visibility = "hidden"; },
      });
      return () => { tw.kill(); };
    }

    root.style.visibility = "visible";
    backRef.current?.focus({ preventScroll: true });

    if (reducedMotion()) {
      gsap.set(root, { opacity: 1 });
      gsap.set(fit, { y: 0, scale: 1, opacity: 1, scaleX: 1 });
      gsap.set(glass, { y: 0, opacity: 0.9 });
      gsap.set(Array.from(info.children), { y: 0, opacity: 1 });
      return;
    }

    const tl = gsap.timeline();
    tl.to(root, { opacity: 1, duration: 0.4, ease: "power2.out" })
      .fromTo(fit, { y: 120, scale: 0.6, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.9, ease: "power3.out" }, "-=.1")
      .fromTo(glass, { y: 40, opacity: 0 }, { y: 0, opacity: 0.9, duration: 0.6, ease: "power2.out" }, "-=.7")
      .fromTo(Array.from(info.children), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.07 }, "-=.5");
    return () => { tl.kill(); };
  }, [product]);

  // Escape closes
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  // ── FRONT / BACK cross-fade (scaleX squash) ──────────────────────────
  const flip = useCallback((next: Side) => {
    const img = fitRef.current;
    if (!img || next === side) return;
    if (reducedMotion()) { setSide(next); return; }
    gsap.to(img, {
      opacity: 0, scaleX: 0.86, duration: 0.16, ease: "power2.in",
      onComplete: () => {
        flushSync(() => setSide(next));
        gsap.fromTo(img, { opacity: 0, scaleX: 0.86 }, { opacity: 1, scaleX: 1, duration: 0.4, ease: "power3.out" });
      },
    });
  }, [side]);

  // ── Pour into glass → cart ───────────────────────────────────────────
  const pour = () => {
    if (!shown || !size) return;
    addItem(shown, size, shown.colorNames[0] ?? "");
    flyToCart(pourRef.current);
    setPoured(true);
    window.setTimeout(() => setPoured(false), 1800);
  };

  const p = shown;
  const allOut = !!p && p.sizes.every((v) => v.stock === 0);

  return (
    <section
      ref={rootRef}
      className={s.serve}
      role="dialog"
      aria-modal={product ? true : undefined}
      aria-hidden={product ? undefined : true}
      aria-label={p ? S.dialog(p.name) : undefined}
      inert={!product}
    >
      <button ref={backRef} type="button" className={s.backbar} data-hover onClick={onClose}>
        {S.back}
      </button>
      <div className={s.wrap}>
        <div className={s.serveVisual}>
          <div className={s.serveGlow} />
          {p && (
            <Image
              ref={fitRef}
              className={s.serveFit}
              src={side === "front" ? p.frontImage : p.backImage}
              alt={`${p.imageAlt} — ${side}`}
              width={600}
              height={800}
              sizes="(max-width: 860px) 80vw, 50vw"
              priority
            />
          )}
          <div ref={glassRef} className={s.serveGlass}>
            <Goblet width={150} />
          </div>
          <div className={s.fbToggle} role="group" aria-label="Garment side">
            <button type="button" className={`${s.fb} ${side === "front" ? s.on : ""}`} aria-pressed={side === "front"} data-hover onClick={() => flip("front")}>
              {S.front}
            </button>
            <button type="button" className={`${s.fb} ${side === "back" ? s.on : ""}`} aria-pressed={side === "back"} data-hover onClick={() => flip("back")}>
              {S.backSide}
            </button>
          </div>
        </div>

        <div ref={infoRef} className={s.serveInfo}>
          <div className={s.serveEyebrow}>{S.eyebrow}</div>
          <h2 className={s.serveName}>{p?.name}</h2>
          <div className={s.serveHi}>{p?.hindi}</div>
          <div className={s.serveSpecs}>
            {p && specsFor(p).map((t) => <span key={t}>{t}</span>)}
          </div>
          <div className={s.servePrice}>{p ? formatPrice(p.price) : ""}</div>
          <div className={s.caps} role="group" aria-label="Size">
            {p?.sizes.map((v) => {
              const out = v.stock === 0;
              return (
                <button
                  key={v.size}
                  type="button"
                  className={`${s.cap} ${size === v.size ? s.on : ""}`}
                  aria-pressed={size === v.size}
                  aria-label={S.sizeAria(v.size, out)}
                  disabled={out}
                  onClick={() => setSize(v.size)}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          <button
            ref={pourRef}
            type="button"
            className={s.pourbtn}
            data-mag
            data-hover
            data-poured={poured}
            disabled={!size || allOut}
            onClick={pour}
          >
            <span className={s.bgf} />
            <span aria-live="polite">{allOut ? S.tappedOut : poured ? S.poured : S.pour}</span>
          </button>
        </div>
      </div>
    </section>
  );
}

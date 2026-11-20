"use client";

// Top-right buy panel on desktop, bottom dock on mobile (CSS only).
// Colourway swatches · size select (native) · Add to bag · Back/Front · Design details.
//
// Add to bag → the existing cart store's addItem(product, size, colour) — the
// same call the product page makes. With no size: the select underline goes
// amber, the select shakes (elastic) and a toast nudges. On success: the pill
// reads "Poured ✓", the bag count bounces (onAdded) and a toast confirms.

import { useRef, useState, type Ref } from "react";
import { gsap } from "gsap";
import type { Size, WallDesign, WallProduct } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { prefersReducedMotion } from "./motion";
import type { Side } from "./wallStore";
import s from "./wall.module.css";

const P = lang.wall.panel;
const D = lang.wall.details;

interface BuyPanelProps {
  ref?: Ref<HTMLElement>;
  /** The design on screen and the colourway (its own product) that is chosen. */
  design: WallDesign;
  product: WallProduct;
  onPick: (index: number) => void;
  side: Side;
  onSide: (side: Side) => void;
  onToast: (text: string) => void;
  /** Called after a successful add (bounces the bag count). */
  onAdded: () => void;
}

export function BuyPanel({ ref, design, product, onPick, side, onSide, onToast, onAdded }: BuyPanelProps) {
  const addItem = useCartStore((st) => st.addItem);
  const selwRef = useRef<HTMLDivElement>(null);
  const detlRef = useRef<HTMLUListElement>(null);

  const [size, setSize] = useState("");
  const [need, setNeed] = useState(false);
  const [poured, setPoured] = useState(false);
  const [open, setOpen] = useState(false);

  // New fit on screen → clear the "need a size" / "Poured ✓" state (the chosen size stays)
  const [lastSlug, setLastSlug] = useState(product.slug);
  if (product.slug !== lastSlug) {
    setLastSlug(product.slug);
    setNeed(false);
    setPoured(false);
  }

  const add = () => {
    if (!size) {
      setNeed(true);
      gsap.fromTo(selwRef.current, { x: -6 }, { x: 0, duration: prefersReducedMotion() ? 0 : 0.5, ease: "elastic.out(1,.3)" });
      onToast(lang.wall.toast.pickSize);
      return;
    }
    addItem(product, size as Size, product.colourway ?? product.colorNames[0] ?? "");
    setPoured(true);
    onAdded();
    onToast(lang.wall.toast.poured(product.name, size));
  };

  const toggleDetails = () => {
    const next = !open;
    setOpen(next);
    gsap.to(detlRef.current, { height: next ? "auto" : 0, duration: prefersReducedMotion() ? 0 : 0.45, ease: "power3.inOut" });
  };

  return (
    <aside ref={ref} className={`${s.panel} ${s.pv}`} data-nodrag>
      <div className={`${s.eb} ${s.mono}`}>{P.eyebrow}</div>
      <div className={s.row}>
        <span className={s.cw}>{product.colourway}</span>
        <span className={s.pr}>{formatPrice(product.price)}</span>
      </div>
      <div className={s.sws} role="radiogroup" aria-label={P.colourwayAria}>
        {design.products.map((c, j) => (
          <button
            key={c.slug}
            type="button"
            role="radio"
            aria-checked={c.slug === product.slug}
            aria-label={c.colourway}
            title={c.colourway}
            data-sw={c.slug}
            style={{ background: c.swatch }}
            onClick={() => onPick(j)}
          />
        ))}
      </div>
      <div className={s.lab}>
        <span>{P.chooseSize}</span>
        <span className={s.mono}>{P.fit}</span>
      </div>
      <div ref={selwRef} className={`${s.sel} ${need ? s.need : ""}`}>
        <select
          value={size}
          aria-label={P.sizeAria}
          onChange={(e) => { setSize(e.target.value); setNeed(false); }}
        >
          <option value="">{P.selectSize}</option>
          {product.sizes.map((v) => (
            <option key={v.size} value={v.size} disabled={v.stock === 0}>{v.size}</option>
          ))}
        </select>
      </div>
      <button type="button" className={s.add} aria-label={poured ? P.poured : P.add} onClick={add}>
        <span className={s.t}>
          <b>{poured ? P.poured : P.add}</b>
          <small>{P.ships}</small>
        </span>
        <span className={s.ic}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M3 5h10l-1 9H4L3 5Z" /><path d="M5.5 5V4a2.5 2.5 0 0 1 5 0v1" />
          </svg>
        </span>
      </button>
      <div className={s.pvrow}>
        <div className={`${s.flip} ${s.mono}`} role="group" aria-label={P.viewAria}>
          <button type="button" aria-pressed={side === "back"} onClick={() => onSide("back")}>{P.back}</button>
          <button type="button" aria-pressed={side === "front"} onClick={() => onSide("front")}>{P.front}</button>
        </div>
        <button type="button" className={s.det} aria-expanded={open} onClick={toggleDetails}>{P.details}</button>
      </div>
      <ul ref={detlRef} className={s.detl}>
        <li><span>{D.fabric}</span><span>{product.gsm ? D.fabricVal(product.gsm) : product.fabric}</span></li>
        <li><span>{D.fit}</span><span>{D.fitVal}</span></li>
        <li><span>{D.print}</span><span>{D.printVal}</span></li>
      </ul>
    </aside>
  );
}

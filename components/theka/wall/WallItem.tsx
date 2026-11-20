"use client";

// One fit on its ledge: shadow img · Ledge · contact shadow · fit img.
// Plain <img> on purpose — the wall zooms by CSS transform (~3.5×), so
// next/image would pick a ~200px srcset entry and the product would go soft.

import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import type { WallProduct } from "@/data/pour-001";
import { formatPrice } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { Ledge } from "./Ledge";
import s from "./wall.module.css";

interface WallItemProps {
  ref?: Ref<HTMLButtonElement>;
  product: WallProduct;
  /** Ledge lit (hover / focus). */
  on: boolean;
  /** Show the front instead of the back (product view, this fit). The back print is the default. */
  showFront: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
  /** Static placement (product page): CSS custom props etc. The wall positions items imperatively instead. */
  style?: CSSProperties;
  /** Hero image: the front photo loads eagerly with high priority (its shadow and the back do not). */
  priority?: boolean;
  /** Off-centre sliver: lazy, low priority (not downloaded at all while display:none). */
  lazy?: boolean;
  tabIndex?: number;
  /** The product the page is about (product page only). */
  main?: boolean;
  /**
   * Wall only: leave the images without a `src` until the item is within ~150px of the
   * scroller's viewport (a phone only shows the first ~6 fits). Native loading="lazy" can't
   * do this: items sit stacked in view until JS lays them out, and Chrome's lazy margin
   * is >1000px anyway.
   */
  deferArt?: boolean;
}

export function WallItem({ ref, product, on, showFront, onEnter, onLeave, onClick, style, priority, lazy, tabIndex, main, deferArt }: WallItemProps) {
  const { wall } = product;
  const own = useRef<HTMLButtonElement | null>(null);
  const [armed, setArmed] = useState(!deferArt);

  useEffect(() => {
    const el = own.current;
    if (armed || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setArmed(true), 0); // no IO: just load
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) { setArmed(true); io.disconnect(); } },
      { root: el.closest<HTMLElement>("[data-wall-scroller]"), rootMargin: "150px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed]);

  const attach = (el: HTMLButtonElement | null) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = el;
  };
  const art = (src: string) => (armed ? src : undefined);

  return (
    <button
      ref={attach}
      type="button"
      className={s.item}
      data-on={on}
      data-slug={product.slug}
      style={style}
      data-main={main ? "" : undefined}
      tabIndex={tabIndex}
      aria-label={lang.wall.itemAria(product.name, formatPrice(product.price))}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.sh} data-sh src={art(showFront ? wall.frontShadow : wall.backShadow)} alt="" draggable={false} decoding="async"
        {...(lazy ? { loading: "lazy" as const, fetchPriority: "low" as const } : {})} />
      <Ledge />
      <div className={s.contact} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.fit}
        data-fit
        src={art(showFront ? wall.front : wall.back)}
        alt={`${product.name} tee, ${showFront ? "front" : "back print"}`}
        draggable={false}
        {...(priority ? { fetchPriority: "high" as const, loading: "eager" as const } : lazy ? { loading: "lazy" as const, fetchPriority: "low" as const } : {})}
      />
    </button>
  );
}

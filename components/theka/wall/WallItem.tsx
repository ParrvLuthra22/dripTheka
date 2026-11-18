"use client";

// One fit on its ledge: shadow img · Ledge · contact shadow · fit img.
// Plain <img> on purpose — the wall zooms by CSS transform (~3.5×), so
// next/image would pick a ~200px srcset entry and the product would go soft.

import type { Ref } from "react";
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
  /** Show the back of the garment (product view, this fit). */
  showBack: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}

export function WallItem({ ref, product, on, showBack, onEnter, onLeave, onClick }: WallItemProps) {
  const { wall } = product;
  return (
    <button
      ref={ref}
      type="button"
      className={s.item}
      data-on={on}
      data-slug={product.slug}
      aria-label={lang.wall.itemAria(product.name, formatPrice(product.price))}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className={s.sh} data-sh src={showBack ? wall.backShadow : wall.frontShadow} alt="" draggable={false} />
      <Ledge />
      <div className={s.contact} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className={s.fit}
        data-fit
        src={showBack ? wall.back : wall.front}
        alt={`${product.name} tee`}
        draggable={false}
      />
    </button>
  );
}

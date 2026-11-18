"use client";

// GlassUnit — one fit served in a glass on the shelf (.unit in the reference):
// glow · pour-line · fit image · goblet · meta (name / hindi / price).
// Hover (CSS only): fit lifts 14px, glow → opacity 1, pour-line appears.
// The glow animates OPACITY ONLY — see bar.module.css (hover-fix).

import type { Ref } from "react";
import Image from "next/image";
import type { Product } from "@/data/pour-001";
import { formatPrice } from "@/lib/utils/format";
import { lang } from "@/lib/theka/lang";
import { Goblet } from "./Goblet";
import s from "./bar.module.css";

interface GlassUnitProps {
  ref?: Ref<HTMLButtonElement>;
  product: Product;
  onPour: (slug: string, el: HTMLButtonElement) => void;
}

export function GlassUnit({ ref, product, onPour }: GlassUnitProps) {
  const price = formatPrice(product.price);
  return (
    <button
      ref={ref}
      type="button"
      className={s.unit}
      data-hover
      data-slug={product.slug}
      aria-label={lang.bar.glassAria(product.name, price)}
      onClick={(e) => onPour(product.slug, e.currentTarget)}
    >
      <div className={s.stage}>
        <div className={s.glow} />
        <div className={s.pourline} />
        <Image
          className={s.fit}
          src={product.frontImage}
          alt=""
          width={600}
          height={800}
          sizes="(max-width: 820px) 50vw, 230px"
          draggable={false}
        />
        <Goblet className={s.goblet} width="100%" />
      </div>
      <div className={s.meta} aria-hidden="true">
        <div className={s.n}>{product.name}</div>
        <div className={s.h}>{product.hindi}</div>
        <div className={s.p}>{price}</div>
      </div>
    </button>
  );
}

// Top-left product block (shown in product view). aria-live so a swap along the
// aisle is announced.

import type { Ref } from "react";
import type { WallProduct } from "@/data/pour-001";
import { lang } from "@/lib/theka/lang";
import s from "./wall.module.css";

export function ProductInfo({ ref, product }: { ref?: Ref<HTMLElement>; product: WallProduct }) {
  return (
    <section ref={ref} className={`${s.info} ${s.pv}`} aria-live="polite">
      <div className={`${s.eb} ${s.mono}`}>{lang.wall.info.eyebrow(product.code ?? "")}</div>
      <h1>{product.name}</h1>
      <div className={s.hi}>{product.hindi}</div>
      <p>{product.blurb}</p>
    </section>
  );
}

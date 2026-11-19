// Header — wine-glass mark + DRIP THEKA, centre "Collection¹⁰" (→ "← Collection"
// in product view) · Try the Look, right Bag (n). Matches the reference exactly.

import Link from "next/link";
import type { Ref } from "react";
import { lang } from "@/lib/theka/lang";
import s from "./wall.module.css";

interface WallHeaderProps {
  ref?: Ref<HTMLElement>;
  zoomed: boolean;
  /** Number of fits on the wall (the superscript). */
  total: number;
  bagCount: number;
  bagNumRef?: Ref<HTMLElement>;
  onBack?: () => void;
  /** Product page: "← Collection" is a real link (works without JS). */
  backHref?: string;
}

const H = lang.wall.header;

export function WallHeader({ ref, zoomed, total, bagCount, bagNumRef, onBack, backHref }: WallHeaderProps) {
  return (
    <header ref={ref} className={s.header} data-nodrag>
      <div className={s.logo} aria-label="Drip Theka">
        <svg viewBox="0 0 18 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M2 1.5h14c0 6-2.6 9.2-7 9.2S2 7.5 2 1.5Z" /><path d="M9 10.7v8.3M4.5 20.5h9" />
        </svg>
        {H.logo}
      </div>
      <nav className={s.center} aria-label="Primary">
        {zoomed && backHref ? (
          <Link href={backHref} className={s.backBtn} style={{ display: "inline-block" }}>{H.back}</Link>
        ) : zoomed ? (
          <button type="button" className={s.backBtn} style={{ display: "inline-block" }} onClick={onBack}>{H.back}</button>
        ) : (
          <button type="button" className={s.act} aria-current="page">{H.collection}<sup>{total}</sup></button>
        )}
        <Link href={H.lookHref} className={s.tl}>{H.look}</Link>
      </nav>
      <Link href="/cart" className={s.bag} aria-label={H.bagAria(bagCount)}>
        {H.bag} (<b ref={bagNumRef}>{bagCount}</b>)
      </Link>
    </header>
  );
}

// Header — the brand's glass mark (/brand/logo_glass.png) + DRIP THEKA, centre "Collection¹⁰" (→ "← Collection"
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

// /cart and the try-the-look room live in the (site) shell (Lenis, motion, sound…): never
// prefetch them from the Wall, or their JS rides along on every wall page.
export function WallHeader({ ref, zoomed, total, bagCount, bagNumRef, onBack, backHref }: WallHeaderProps) {
  return (
    <header ref={ref} className={s.header} data-nodrag>
      <div className={s.logo} aria-label="Drip Theka">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo_glass.png" alt="" width={11} height={20} />
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
        <Link href={H.lookHref} prefetch={false} className={s.tl}>{H.look}</Link>
      </nav>
      <Link href="/cart" prefetch={false} className={s.bag} aria-label={H.bagAria(bagCount)}>
        {H.bag} (<b ref={bagNumRef}>{bagCount}</b>)
      </Link>
    </header>
  );
}

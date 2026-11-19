// Prev / next arrows at the screen edges + the counter. Hidden on mobile (CSS).
//
// With `prevHref` / `nextHref` (product page) the arrows are real <Link>s to the
// neighbouring product pages, so they're crawlable, prefetched and open in a new
// tab. Without them (the Wall's own camera) they stay buttons driving onPrev/onNext.

import type { Ref } from "react";
import Link from "next/link";
import { lang } from "@/lib/theka/lang";
import s from "./wall.module.css";

interface AisleControlsProps {
  prevRef?: Ref<HTMLButtonElement>;
  nextRef?: Ref<HTMLButtonElement>;
  countRef?: Ref<HTMLDivElement>;
  /** Code of the current fit, e.g. "04". */
  code: string;
  /** 1-based position and total. */
  index: number;
  total: number;
  onPrev?: () => void;
  onNext?: () => void;
  prevHref?: string;
  nextHref?: string;
}

const P = lang.wall.panel;
const PREV_ICON = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>;
const NEXT_ICON = <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>;

export function AisleControls({ prevRef, nextRef, countRef, code, index, total, onPrev, onNext, prevHref, nextHref }: AisleControlsProps) {
  return (
    <>
      {prevHref ? (
        <Link href={prevHref} className={`${s.navArrow} ${s.prev} ${s.pv}`} data-nodrag aria-label={P.prevAria} rel="prev">
          {PREV_ICON}
        </Link>
      ) : (
        <button ref={prevRef} type="button" className={`${s.navArrow} ${s.prev} ${s.pv}`} data-nodrag aria-label={P.prevAria} onClick={onPrev}>
          {PREV_ICON}
        </button>
      )}
      {nextHref ? (
        <Link href={nextHref} className={`${s.navArrow} ${s.next} ${s.pv}`} data-nodrag aria-label={P.nextAria} rel="next">
          {NEXT_ICON}
        </Link>
      ) : (
        <button ref={nextRef} type="button" className={`${s.navArrow} ${s.next} ${s.pv}`} data-nodrag aria-label={P.nextAria} onClick={onNext}>
          {NEXT_ICON}
        </button>
      )}
      <div ref={countRef} className={`${s.count} ${s.mono} ${s.pv}`}>
        <span>{code}</span>
        <i><b style={{ width: `${(index / total) * 100}%` }} /></i>
        <span>{String(total).padStart(2, "0")}</span>
      </div>
    </>
  );
}

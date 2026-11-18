// Prev / next arrows at the screen edges + the counter. Hidden on mobile (CSS).

import type { Ref } from "react";
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
  onPrev: () => void;
  onNext: () => void;
}

const P = lang.wall.panel;

export function AisleControls({ prevRef, nextRef, countRef, code, index, total, onPrev, onNext }: AisleControlsProps) {
  return (
    <>
      <button ref={prevRef} type="button" className={`${s.navArrow} ${s.prev} ${s.pv}`} data-nodrag aria-label={P.prevAria} onClick={onPrev}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M10 3 5 8l5 5" /></svg>
      </button>
      <button ref={nextRef} type="button" className={`${s.navArrow} ${s.next} ${s.pv}`} data-nodrag aria-label={P.nextAria} onClick={onNext}>
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
      </button>
      <div ref={countRef} className={`${s.count} ${s.mono} ${s.pv}`}>
        <span>{code}</span>
        <i><b style={{ width: `${(index / total) * 100}%` }} /></i>
        <span>{String(total).padStart(2, "0")}</span>
      </div>
    </>
  );
}

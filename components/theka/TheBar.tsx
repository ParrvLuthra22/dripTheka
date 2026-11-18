"use client";

// TheBar — the home route and the signature: Gate → Bar → Pour as STATES on
// one page (no route change), ported from the approved bar-reference.html.
//
//   • background plate, nav (logo · links · BAG · N), "Currently Pouring" head
//   • the shelf of GlassUnits — fits come from the product data layer
//   • owns the staggered entrance, appended to the Gate's timeline:
//       .nav,.bar-head  from { y:-20, opacity:0 } .8s power3.out stagger .1  (-=.4)
//       .unit           from { y:60,  opacity:0 } 1s  power3.out stagger .09 (-=.5)
//       .unit           clearProps opacity,transform
//   • Gate plays once per session (sessionStorage); returning visits land on
//     the bar directly with no entrance.
//   • custom cursor (useCursor) + magnetic buttons — desktop only.

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import type { Product } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/theka/hooks";
import { lang } from "@/lib/theka/lang";
import { Gate } from "./Gate";
import { GlassUnit } from "./GlassUnit";
import { ServePour } from "./ServePour";
import { useCursor } from "./useCursor";
import s from "./bar.module.css";

const GATE_KEY = "dt-gate-entered";
const B = lang.bar;

interface TheBarProps {
  products: Product[];
  /** Background plate for the gate + bar. */
  plate: string;
}

function readGateSeen(): boolean {
  try { return sessionStorage.getItem(GATE_KEY) === "1"; } catch { return false; }
}

export function TheBar({ products, plate }: TheBarProps) {
  const appRef   = useRef<HTMLDivElement>(null);
  const barRef   = useRef<HTMLElement>(null);
  const navRef   = useRef<HTMLElement>(null);
  const headRef  = useRef<HTMLDivElement>(null);
  const unitRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const opener   = useRef<HTMLButtonElement | null>(null);

  const { dotRef, ringRef, lblRef } = useCursor(appRef, s.lbl);

  // Returning within the session → skip the gate (read after hydration).
  const hydrated  = useHydrated();
  const [skipGate] = useState(() => typeof window !== "undefined" && readGateSeen());
  const gateSkipped = hydrated && skipGate;

  const [serving, setServing] = useState<Product | null>(null);

  const count = useCartStore((st) => st.items.reduce((n, i) => n + i.quantity, 0));
  const bagCount = hydrated ? count : 0;

  const showBar = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.visibility = "visible";
    gsap.set(bar, { opacity: 1 });
  }, []);

  // Returning visitor: bar visible immediately, no entrance.
  useEffect(() => { if (gateSkipped) showBar(); }, [gateSkipped, showBar]);

  const onEnter = useCallback((tl: gsap.core.Timeline | null) => {
    try { sessionStorage.setItem(GATE_KEY, "1"); } catch { /* private mode */ }
    if (!tl) return; // reduced motion — final state, no stagger
    const units = unitRefs.current.filter(Boolean) as HTMLButtonElement[];
    const head = [navRef.current, headRef.current].filter(Boolean) as HTMLElement[];
    tl.from(head, { y: -20, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1 }, "-=.4")
      .from(units, { y: 60, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.09 }, "-=.5")
      .set(units, { clearProps: "opacity,transform" });
  }, []);

  const pour = useCallback((slug: string, el: HTMLButtonElement) => {
    opener.current = el;
    setServing(products.find((p) => p.slug === slug) ?? null);
  }, [products]);

  const close = useCallback(() => {
    setServing(null);
    // The bar is `inert` until this state commits — focus the opener after.
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  }, []);

  return (
    <div ref={appRef} className={s.app}>
      {/* PRESERVE: grain has no mix-blend-mode */}
      <div className={s.grain} />

      <Gate plate={plate} skipped={gateSkipped} onReveal={showBar} onEnter={onEnter} />

      <section ref={barRef} className={s.bar} aria-hidden={serving ? true : undefined} inert={!!serving}>
        <Image className={s.bg} src={plate} alt="" fill sizes="100vw" />
        <div className={s.vg} />

        <nav ref={navRef} className={s.nav} aria-label="Primary">
          <div className={s.logo}>{B.nav.logo}</div>
          <div className={s.links}>
            {B.nav.links.map((l) => (
              <Link key={l.href} href={l.href} data-hover aria-current={l.href === "/" ? "page" : undefined}>
                {l.label}
              </Link>
            ))}
          </div>
          <Link href="/cart" className={s.bag} data-hover data-cart-target aria-label={B.nav.bagAria(bagCount)}>
            {B.nav.bag(bagCount)}
          </Link>
        </nav>

        <div ref={headRef} className={s.barHead}>
          <div className={s.barEyebrow}>{B.head.eyebrow} <i>{B.head.gloss}</i></div>
          <h2 className={s.barTitle}>{B.head.title}</h2>
        </div>

        {/* PRESERVE: shelf is isolated (translateZ(0) + isolation) */}
        <div className={s.shelf}>
          <div className={s.row}>
            {products.map((p, i) => (
              <GlassUnit
                key={p.slug}
                ref={(el) => { unitRefs.current[i] = el; }}
                product={p}
                onPour={pour}
              />
            ))}
          </div>
        </div>
        <div className={s.hint}>{B.hint} &nbsp; {B.swipe}</div>
      </section>

      <ServePour product={serving} onClose={close} />

      {/* cursor — desktop only (CSS hides under hover:none / ≤820px) */}
      <div ref={ringRef} className={s.curRing} aria-hidden="true" />
      <div ref={dotRef} className={`${s.cur} ${s.curDot}`} aria-hidden="true" />
      <div ref={lblRef} className={s.curLbl} aria-hidden="true">{B.cursor}</div>
    </div>
  );
}

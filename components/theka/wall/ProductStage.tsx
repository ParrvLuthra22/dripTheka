"use client";

// ProductStage — the Wall's zoomed product view, rendered statically for
// /product/[slug]: same plaster, light and vignette; the product large and
// centred on its acrylic ledge with its row neighbours as edge slivers; the same
// ProductInfo / BuyPanel / flip / cart wiring.
//
// There is no camera animation. The camera is CSS (see the `.page` block in
// wall.module.css) so the server HTML is already framed; the one number CSS
// can't compute — the zoom factor s — is measured here with wallLayout and set
// as `--s` before paint (and on resize).

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import type { WallDesign, WallProduct } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/theka/hooks";
import { AR, cameraTarget, computeLayout } from "./wallLayout";
import { prefersReducedMotion } from "./motion";
import type { Side } from "./wallStore";
import { WallItem } from "./WallItem";
import { WallHeader } from "./WallHeader";
import { ProductInfo } from "./ProductInfo";
import { BuyPanel } from "./BuyPanel";
import { AisleControls } from "./AisleControls";
import s from "./wall.module.css";

export interface StageCell {
  design: WallDesign;
  /** The colourway shown in this cell. */
  product: WallProduct;
  /** Desktop grid cell (rows of 4) — the same as on the Wall. */
  col: number;
  row: number;
  /** Fits in this cell's row (short rows are centred). */
  inRow: number;
}

interface ProductStageProps {
  design: WallDesign;
  /** The colourway the URL names. */
  product: WallProduct;
  /** Position of the design in wall order (0-based) and the number of designs on the wall. */
  index: number;
  total: number;
  /** The current fit plus the same-row neighbours that peek in at the edges. */
  cells: StageCell[];
  /** Box aspect ratio of every fit on the wall, in wall order (drives the zoom factor). */
  ars: number[];
  prevHref: string;
  nextHref: string;
  backHref: string;
}

const cellStyle = (c: StageCell): CSSProperties =>
  ({ "--c": c.col, "--r": c.row, "--n": c.inRow, "--ar": c.product.wall.ar ?? AR }) as CSSProperties;

export function ProductStage({ design, product: initial, index, total, cells, ars, prevHref, nextHref, backHref }: ProductStageProps) {
  const router = useRouter();
  const hydrated = useHydrated();
  const count = useCartStore((st) => st.items.reduce((t, i) => t + i.quantity, 0));
  const bagCount = hydrated ? count : 0;

  const [side, setSide] = useState<Side>("back");
  // Colourway chosen (label / swatches / add-to-bag) and colourway on the ledge (follows after the crossfade).
  const start = Math.max(0, design.products.findIndex((p) => p.slug === initial.slug));
  const [pick, setPick] = useState(start);
  const [art, setArt] = useState(start);
  const product = design.products[pick];
  const rootRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const bagNumRef = useRef<HTMLElement>(null);

  // Exact zoom factor from the same maths the Wall uses; re-measured on resize.
  useLayoutEffect(() => {
    const root = rootRef.current, scene = sceneRef.current;
    if (!root || !scene) return;
    const apply = () => {
      const L = computeLayout(scene.clientWidth, scene.clientHeight, ars);
      const cam = cameraTarget(L, index, 0);
      root.style.setProperty("--s", String(cam.s));
      // the wall bg scales by 1 + (s − 1)·.10 (bgScale) — derived from --s in CSS
    };
    apply();
    let t: ReturnType<typeof setTimeout> | undefined;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(apply, 60); });
    ro.observe(scene);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [ars, index]);

  // Esc → back to the wall, ←/→ → neighbours (same keys as the Wall; not while typing in the size select)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "Escape") router.push(backHref);
      else if (e.key === "ArrowRight") router.push(nextHref);
      else if (e.key === "ArrowLeft") router.push(prevHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, backHref, prevHref, nextHref]);

  // Front/Back: the Wall's squash flip (.2s in, swap, .38s out); instant under reduced motion.
  const flipTo = (next: Side) => {
    if (next === side) return;
    const main = mainRef.current;
    if (!main || prefersReducedMotion()) { setSide(next); return; }
    const targets = [main.querySelector("[data-fit]"), main.querySelector("[data-sh]")].filter(Boolean);
    gsap.to(targets, {
      scaleX: 0, duration: 0.2, ease: "power2.in",
      onComplete: () => {
        flushSync(() => setSide(next)); // src swaps before the squash reverses
        gsap.to(targets, { scaleX: 1, duration: 0.38, ease: "power3.out", clearProps: "transform" });
      },
    });
  };

  const toast = (text: string) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = text;
    gsap.killTweensOf(el);
    if (prefersReducedMotion()) {
      gsap.set(el, { autoAlpha: 1, y: 0 });
      gsap.set(el, { autoAlpha: 0, delay: 2.2 });
      return;
    }
    gsap.timeline()
      .to(el, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" })
      .to(el, { autoAlpha: 0, y: -10, duration: 0.35, delay: 1.8 });
  };

  const bagBounce = () => {
    const el = bagNumRef.current;
    if (el && !prefersReducedMotion()) gsap.fromTo(el, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(3)" });
  };

  const pickCw = (j: number) => {
    if (j === pick) return;
    setPick(j);
    try { window.history.replaceState(null, "", `/product/${design.products[j].slug}`); } catch { /* sandboxed */ }
    const m = mainRef.current;
    const f = m?.querySelector<HTMLElement>("[data-fit]"), sh = m?.querySelector<HTMLElement>("[data-sh]");
    if (!f || !sh || prefersReducedMotion()) { setArt(j); return; }
    gsap.killTweensOf([f, sh]);
    gsap.to([f, sh], {
      opacity: 0, duration: 0.18,
      onComplete: () => {
        flushSync(() => setArt(j)); // src swaps while hidden
        gsap.to(f, { opacity: 1, duration: 0.35 });
        gsap.to(sh, { opacity: 0.75, duration: 0.35 });
      },
    });
  };

  const main = cells.find((c) => c.design === design) ?? cells[0];

  return (
    <div ref={rootRef} className={`${s.app} ${s.page}`} data-product-stage>
      <div ref={sceneRef} className={s.scene}>
        <div className={s.bg} data-art="" />
        <div className={s.world} style={cellStyle(main)}>
          {cells.map((c) => {
            const isMain = c.design === design;
            return (
              <WallItem
                key={c.design.design}
                ref={isMain ? mainRef : undefined}
                product={isMain ? design.products[art] : c.product}
                on={false}
                showFront={isMain && side === "front"}
                onEnter={() => {}}
                onLeave={() => {}}
                onClick={() => { if (!isMain) router.push(`/product/${c.design.products[0].slug}`); }}
                style={cellStyle(c)}
                priority={isMain}
                lazy={!isMain}
                tabIndex={-1}
                main={isMain}
              />
            );
          })}
        </div>
        <div className={s.light} />
      </div>

      <WallHeader zoomed total={total} bagCount={bagCount} bagNumRef={bagNumRef} backHref={backHref} />
      <ProductInfo product={design} />
      <BuyPanel
        design={design}
        product={product}
        onPick={pickCw}
        side={side}
        onSide={flipTo}
        onToast={toast}
        onAdded={bagBounce}
      />
      <AisleControls
        code={design.code}
        index={index + 1}
        total={total}
        prevHref={prevHref}
        nextHref={nextHref}
      />
      <div ref={toastRef} className={s.toast} role="status" aria-live="polite" />
    </div>
  );
}

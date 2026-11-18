"use client";

// TheWall — the home route. A plaster wall, products on acrylic ledges, and a
// camera (the #world scale/translate, tweened with GSAP) that zooms into a fit.
// Ported 1:1 from wall-reference/index.html; geometry lives in wallLayout.ts.
//
//   mode:  'wall' ⇄ 'zoom'        (imperative — drives the camera + gestures)
//   view:  zoomed · cur · side · hover   (wallStore → what React renders)
//
// Everything that touches the camera/overlays is created once in the mount
// effect and exposed through `api` so JSX handlers stay thin.

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import type { WallProduct } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/theka/hooks";
import { lang } from "@/lib/theka/lang";
import { AisleControls } from "./AisleControls";
import { BuyPanel } from "./BuyPanel";
import { Blackout, lightsSeen, playLightsOn } from "./LightsOn";
import { ProductInfo } from "./ProductInfo";
import { WallHeader } from "./WallHeader";
import { WallItem } from "./WallItem";
import {
  bgScale, cameraTarget, computeLayout, isRowJump, scrollAfterClose, type Layout,
} from "./wallLayout";
import { createWallStore, type Side } from "./wallStore";
import s from "./wall.module.css";

const W = lang.wall;

interface WallApi {
  open: (i: number) => void;
  step: (d: number) => void;
  /** Glide to fit i (neighbour click). */
  goTo: (i: number) => void;
  close: () => void;
  side: (side: Side) => void;
  hover: (i: number) => void;
  toast: (text: string) => void;
  bagBounce: () => void;
  /** True while a drag/swipe is in flight — suppresses the click that follows. */
  dragging: () => boolean;
}

export function TheWall({ products }: { products: WallProduct[] }) {
  const n = products.length;
  const [store] = useState(createWallStore);
  const view = useSyncExternalStore(store.subscribe, store.get, store.get);

  const hydrated = useHydrated();
  const count = useCartStore((st) => st.items.reduce((t, i) => t + i.quantity, 0));
  const bagCount = hydrated ? count : 0;

  const api = useRef<WallApi | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const helloRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const bagNumRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => {
    const world = worldRef.current, scroller = scrollerRef.current, bg = bgRef.current;
    const hello = helloRef.current, header = headerRef.current, tag = tagRef.current, foot = footRef.current;
    const blackout = blackoutRef.current, toastEl = toastRef.current;
    const pvOrNull = [infoRef.current, panelRef.current, prevRef.current, nextRef.current, countRef.current];
    const items = itemRefs.current.slice(0, n).filter((e): e is HTMLButtonElement => !!e);
    if (
      !world || !scroller || !bg || !hello || !header || !tag || !foot || !blackout || !toastEl ||
      pvOrNull.some((e) => !e) || items.length !== n
    ) return;
    const pv = pvOrNull as HTMLElement[];
    const infoPanel = [infoRef.current, panelRef.current] as HTMLElement[];

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = (v: number) => (rm ? 0 : v);

    let mode: "wall" | "zoom" = "wall";
    let cur = 0;
    let busy = false;
    let dragged = false;
    let L: Layout = computeLayout(innerWidth, innerHeight, n);

    const fitOf = (i: number) => items[i].querySelector<HTMLElement>("[data-fit]")!;
    const shOf = (i: number) => items[i].querySelector<HTMLElement>("[data-sh]")!;

    // ── layout: position the wall in px (and snap the camera if zoomed) ────
    const applyLayout = () => {
      L = computeLayout(innerWidth, innerHeight, n);
      world.style.height = `${L.worldHeight}px`;
      hello.style.left = `${L.hello.left}px`;
      hello.style.top = `${L.hello.top}px`;
      items.forEach((el, i) => {
        const b = L.items[i];
        el.style.left = `${b.cx - b.w / 2}px`;
        el.style.top = `${b.ly - b.h}px`;
        el.style.width = `${b.w}px`;
        el.style.height = `${b.h}px`;
      });
      scroller.style.overflowY = mode === "zoom" || !L.scrollable ? "hidden" : "auto";
      if (mode === "zoom") {
        const t = cameraTarget(L, cur, scroller.scrollTop);
        gsap.set(world, { x: t.x, y: t.y, scale: t.s });
        gsap.set(bg, { scale: bgScale(t) });
      }
    };

    const setUrl = (slug: string | null) => {
      try {
        const u = new URL(window.location.href);
        if (slug) u.searchParams.set("fit", slug); else u.searchParams.delete("fit");
        window.history.replaceState(null, "", u.pathname + u.search + u.hash);
      } catch { /* sandboxed */ }
    };

    // ── product view ───────────────────────────────────────────────────────
    /** Mobile: only the chosen fit shows; the rest fade to 0 (and back on close). */
    const isolate = (on: boolean) => {
      if (!L.mob && on) return;
      items.forEach((e, k) => {
        gsap.to(e, { opacity: !on || k === cur ? 1 : 0, duration: D(on ? 0.5 : 0.6), delay: D(on ? 0.15 : 0.25) });
      });
    };

    const showPV = (on: boolean, delay = 0) => {
      gsap.to(pv, { autoAlpha: on ? 1 : 0, duration: D(on ? 0.55 : 0.25), delay: D(delay), ease: "power2.out", stagger: on ? 0.04 : 0 });
      gsap.to([hello, tag, foot], { autoAlpha: on ? 0 : 1, duration: D(0.35), delay: D(on ? 0 : 0.55) });
    };

    const swapSide = (next: Side, instant = false) => {
      if (store.get().side === next) return;
      if (instant || rm) { store.set({ side: next }); return; }
      const i = store.get().cur;
      const targets = [fitOf(i), shOf(i)];
      gsap.to(targets, {
        scaleX: 0, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          flushSync(() => store.set({ side: next })); // src swaps before the squash reverses
          gsap.to(targets, { scaleX: 1, duration: 0.38, ease: "power3.out", clearProps: "transform" });
        },
      });
    };

    const open = (i: number) => {
      if (busy) return;
      busy = true; mode = "zoom"; cur = i;
      store.set({ zoomed: true, cur: i, side: "front", hover: -1 });
      scroller.style.overflowY = "hidden";
      scroller.style.touchAction = "none";
      const t = cameraTarget(L, i, scroller.scrollTop);
      gsap.to(world, { x: t.x, y: t.y, scale: t.s, duration: D(1.35), ease: "expo.inOut", onComplete: () => { busy = false; } });
      gsap.to(bg, { scale: bgScale(t), duration: D(1.35), ease: "expo.inOut" });
      showPV(true, 0.75);
      isolate(true);
      setUrl(products[i].slug);
    };

    const go = (i: number) => {
      if (busy || i === cur) return;
      busy = true;
      if (store.get().side === "back") swapSide("front", true);
      const prev = cur;
      cur = (i + n) % n;
      const next = cur;
      gsap.to(infoPanel, {
        autoAlpha: 0, y: -8, duration: D(0.22),
        onComplete: () => {
          store.set({ cur: next });
          gsap.to(infoPanel, { autoAlpha: 1, y: 0, duration: D(0.5), delay: D(0.45), ease: "power2.out" });
        },
      });
      isolate(true);
      const t = cameraTarget(L, next, scroller.scrollTop);
      gsap.to(world, {
        x: t.x, y: t.y, scale: t.s, duration: D(isRowJump(L, prev, next) ? 1.25 : 0.95), ease: "expo.inOut",
        onComplete: () => { busy = false; },
      });
      setUrl(products[next].slug);
    };

    const close = () => {
      if (busy || mode !== "zoom") return;
      busy = true;
      if (store.get().side === "back") swapSide("front", true);
      store.set({ zoomed: false });
      showPV(false);
      isolate(false);
      const old = scroller.scrollTop;
      const ns = scrollAfterClose(L, cur);
      gsap.to(world, {
        x: 0, y: old - ns, scale: 1, duration: D(1.2), ease: "expo.inOut",
        onComplete: () => {
          gsap.set(world, { y: 0 });
          scroller.scrollTop = ns;
          scroller.style.overflowY = L.scrollable ? "auto" : "hidden";
          scroller.style.touchAction = "";
          mode = "wall"; busy = false;
        },
      });
      gsap.to(bg, { scale: 1, x: 0, y: 0, duration: D(1.2), ease: "expo.inOut" });
      setUrl(null);
    };

    /** Deep link (/?fit=slug): land zoomed with no animation. */
    const openInstant = (i: number) => {
      cur = i; mode = "zoom";
      store.set({ zoomed: true, cur: i, side: "front", hover: -1 });
      scroller.style.overflowY = "hidden";
      scroller.style.touchAction = "none";
      const t = cameraTarget(L, i, 0);
      gsap.set(world, { x: t.x, y: t.y, scale: t.s });
      gsap.set(bg, { scale: bgScale(t) });
      gsap.set(pv, { autoAlpha: 1 });
      gsap.set([hello, tag, foot], { autoAlpha: 0 });
      if (L.mob) items.forEach((e, k) => { gsap.set(e, { opacity: k === i ? 1 : 0 }); });
    };

    const toast = (text: string) => {
      toastEl.textContent = text;
      gsap.killTweensOf(toastEl);
      gsap.timeline()
        .to(toastEl, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" })
        .to(toastEl, { autoAlpha: 0, y: -10, duration: 0.35, delay: 1.8 });
    };

    const bagNum = bagNumRef.current;

    api.current = {
      open,
      step: (d) => { if (mode === "zoom") go(cur + d); },
      goTo: (i) => { if (mode === "zoom") go(i); },
      close,
      side: (sd) => swapSide(sd),
      hover: (i) => { if (mode === "wall") store.set({ hover: i }); },
      toast,
      bagBounce: () => {
        if (bagNum) gsap.fromTo(bagNum, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.4), ease: "back.out(3)" });
      },
      dragging: () => dragged,
    };

    // ── gestures ───────────────────────────────────────────────────────────
    const onKey = (e: KeyboardEvent) => {
      if (mode !== "zoom") return;
      // arrow keys inside the size select change the option, not the fit
      if ((e.target as HTMLElement | null)?.closest?.("select, input, textarea")) return;
      if (e.key === "ArrowRight") go(cur + 1);
      else if (e.key === "ArrowLeft") go(cur - 1);
      else if (e.key === "Escape") close();
    };
    let sx: number | null = null, sy = 0;
    const onDown = (e: PointerEvent) => {
      if (mode !== "zoom" || (e.target as Element | null)?.closest?.("[data-nodrag]")) return;
      sx = e.clientX; sy = e.clientY; dragged = false;
    };
    const onMove = (e: PointerEvent) => { if (sx !== null && Math.abs(e.clientX - sx) > 12) dragged = true; };
    const onUp = (e: PointerEvent) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
      setTimeout(() => { dragged = false; }, 0); // after the click that follows the drag
    };
    const onCancel = () => { sx = null; };
    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(applyLayout, 60); };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onCancel);
    addEventListener("resize", onResize);

    // back images are only seen after a flip — warm them (and their shadows)
    const warm = new Set<string>();
    products.forEach((p) => { warm.add(p.wall.back); warm.add(p.wall.backShadow); });
    warm.forEach((src) => { const im = new Image(); im.src = src; });

    // ── start ──────────────────────────────────────────────────────────────
    applyLayout();
    gsap.set(world, { transformOrigin: "0 0" });
    gsap.set(pv, { autoAlpha: 0 });

    let intro: gsap.core.Timeline | null = null;
    const fitParam = new URLSearchParams(window.location.search).get("fit");
    const deep = fitParam ? products.findIndex((p) => p.slug === fitParam) : -1;
    if (deep >= 0) {
      gsap.set(blackout, { autoAlpha: 0 });
      openInstant(deep);
    } else if (rm || lightsSeen()) {
      gsap.set(blackout, { autoAlpha: 0 });
    } else {
      intro = playLightsOn({
        blackout,
        fits: items.map((_, i) => fitOf(i)),
        shadows: items.map((_, i) => shOf(i)),
        chrome: [hello, header, tag, foot],
      });
    }

    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onCancel);
      removeEventListener("resize", onResize);
      clearTimeout(rt);
      intro?.kill();
      gsap.killTweensOf([world, bg, toastEl, ...pv, ...items, hello, tag, foot]);
      api.current = null;
    };
  }, [n, products, store]);

  const current = products[view.cur] ?? products[0];
  const lit = view.hover >= 0 ? products[view.hover] : null;

  return (
    <div className={s.app}>
      <div ref={bgRef} className={s.bg} />
      <div ref={scrollerRef} className={s.scroller}>
        <div ref={worldRef} className={s.world}>
          <div ref={helloRef} className={s.hello}>
            <div className={`${s.eb} ${s.mono}`}>{W.hello.eyebrow}</div>
            <h2>{W.hello.title}</h2>
          </div>
          {products.map((p, i) => (
            <WallItem
              key={p.slug}
              ref={(el) => { itemRefs.current[i] = el; }}
              product={p}
              on={view.hover === i}
              showBack={view.side === "back" && view.cur === i}
              onEnter={() => api.current?.hover(i)}
              onLeave={() => api.current?.hover(-1)}
              onClick={() => {
                const a = api.current;
                if (!a || a.dragging()) return;
                if (view.zoomed) a.goTo(i); else a.open(i);
              }}
            />
          ))}
        </div>
      </div>
      <div className={s.light} />

      <WallHeader
        ref={headerRef}
        zoomed={view.zoomed}
        total={n}
        bagCount={bagCount}
        bagNumRef={bagNumRef}
        onBack={() => api.current?.close()}
      />

      <div ref={tagRef} className={s.tag}>
        <div className={s.n}>{lit ? W.tag.no(lit.code ?? "") : W.tag.pour}</div>
        <div className={`${s.s} ${s.mono}`}>{lit ? lit.name : W.tag.sub(n, products[0]?.gsm ?? 0)}</div>
      </div>
      <div ref={footRef} className={`${s.foot} ${s.mono}`}>{W.foot}</div>

      <ProductInfo ref={infoRef} product={current} />
      <BuyPanel
        ref={panelRef}
        product={current}
        side={view.side}
        onSide={(sd) => api.current?.side(sd)}
        onToast={(t) => api.current?.toast(t)}
        onAdded={() => api.current?.bagBounce()}
      />
      <AisleControls
        prevRef={prevRef}
        nextRef={nextRef}
        countRef={countRef}
        code={current.code ?? ""}
        index={view.cur + 1}
        total={n}
        onPrev={() => api.current?.step(-1)}
        onNext={() => api.current?.step(1)}
      />

      <div ref={toastRef} className={s.toast} role="status" aria-live="polite" />
      <Blackout ref={blackoutRef} />
    </div>
  );
}

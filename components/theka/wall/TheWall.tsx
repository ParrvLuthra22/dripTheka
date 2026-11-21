"use client";

// TheWall — the home route. A plaster wall, products on acrylic ledges, and a
// camera (the #world scale/translate, tweened with GSAP) that zooms into a fit.
// Ported 1:1 from pour001-reference/wall.html; geometry lives in wallLayout.ts.
// One wall item per DESIGN; each design's colourways are separate products (own slug).
//
//   mode:  'wall' ⇄ 'zoom'        (imperative — drives the camera + gestures)
//   view:  zoomed · cur · side · hover   (wallStore → what React renders)
//
// Everything that touches the camera/overlays is created once in the mount
// effect and exposed through `api` so JSX handlers stay thin.

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { findWallSlug, type WallDesign } from "@/data/pour-001";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/theka/hooks";
import { lang } from "@/lib/theka/lang";
import { AisleControls } from "./AisleControls";
import { BuyPanel } from "./BuyPanel";
import { Blackout, lightsSeen, playLightsOn } from "./LightsOn";
import { ProductInfo } from "./ProductInfo";
import { WallDressing } from "./WallDressing";
import { WallHeader } from "./WallHeader";
import { WallItem } from "./WallItem";
import { computeDecor } from "./wallDecor";
import { applyDecor, createNeon, decorAll, findDecor } from "./wallDecorDom";
import {
  AR, bgScale, cameraTarget, computeLayout, isRowJump, scrollAfterClose, type Layout,
} from "./wallLayout";
import { createWallStore, type Side } from "./wallStore";
import s from "./wall.module.css";

const W = lang.wall;

/** Fits that are in the first phone screen (2 per row); the rest fetch their art when scrolled near. */
const FIRST_SCREEN = 4;

interface WallApi {
  open: (i: number) => void;
  /** Choose colourway j of the design on screen (crossfades the art, switches the product). */
  pick: (j: number) => void;
  step: (d: number) => void;
  /** Glide to fit i (neighbour click). */
  goTo: (i: number) => void;
  close: () => void;
  side: (side: Side) => void;
  hover: (i: number) => void;
  toast: (text: string, action?: { label: string; href: string }) => void;
  /** Pour #002 teaser clicked: a toast, never a product view. */
  teaser: () => void;
  /** Fade to the story room (desktop scroll gesture, "Our story ↓", the header link). */
  story: () => void;
  bagBounce: () => void;
  /** True while a drag/swipe is in flight — suppresses the click that follows. */
  dragging: () => boolean;
}

interface TheWallProps {
  designs: WallDesign[];
  /** The Entry is on top: no intro, chrome hidden, no pointer/keyboard handling, aria-hidden. */
  dormant?: boolean;
  /** On the first wake: true → the Entry just handed over (fade the chrome in);
   *  false → a visit that starts at the Wall (deep link / lights-on intro). Later wakes always fade the chrome in. */
  handoff?: boolean;
  /** Visitor scrolled up at the top of the Wall: walk back out. Home flips `dormant`. */
  onExitUp?: () => void;
}

export function TheWall({ designs, dormant = false, handoff = false, onExitUp }: TheWallProps) {
  const n = designs.length;
  const [store] = useState(() => createWallStore(n));
  const view = useSyncExternalStore(store.subscribe, store.get, store.get);

  const hydrated = useHydrated();
  const count = useCartStore((st) => st.items.reduce((t, i) => t + i.quantity, 0));
  const bagCount = hydrated ? count : 0;

  const api = useRef<WallApi | null>(null);
  // Entry handover: read inside the mount effect without re-running it.
  const dormantRef = useRef(dormant);
  const exitRef = useRef(onExitUp);
  const lifecycle = useRef<{ wake: (handoff: boolean) => void; sleep: () => void } | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const helloRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tagRef = useRef<HTMLDivElement>(null);
  const footRef = useRef<HTMLDivElement>(null);
  const blackoutRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const toastTextRef = useRef<HTMLSpanElement>(null);
  const toastActionRef = useRef<HTMLAnchorElement>(null);
  const storyWrapRef = useRef<HTMLDivElement>(null);
  const storyLinkRef = useRef<HTMLAnchorElement>(null);
  const leaveRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const routerRef = useRef(router);
  const bagNumRef = useRef<HTMLElement>(null);
  const infoRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useLayoutEffect(() => { exitRef.current = onExitUp; routerRef.current = router; });

  useLayoutEffect(() => {
    dormantRef.current = dormant;
    const lc = lifecycle.current;
    if (!lc) return; // the mount effect reads dormantRef itself
    if (dormant) lc.sleep(); else lc.wake(handoff);
  }, [dormant, handoff]);

  useLayoutEffect(() => {
    const world = worldRef.current, scroller = scrollerRef.current, bg = bgRef.current;
    const hello = helloRef.current, header = headerRef.current, tag = tagRef.current, foot = footRef.current;
    const blackout = blackoutRef.current, toastEl = toastRef.current;
    const toastText = toastTextRef.current, toastAction = toastActionRef.current;
    const storyWrap = storyWrapRef.current, storyLink = storyLinkRef.current, leave = leaveRef.current;
    const decor = world ? findDecor(world, designs.length) : null;
    const pvOrNull = [infoRef.current, panelRef.current, prevRef.current, nextRef.current, countRef.current];
    const items = itemRefs.current.slice(0, n).filter((e): e is HTMLButtonElement => !!e);
    if (
      !world || !scroller || !bg || !hello || !header || !tag || !foot || !blackout || !toastEl ||
      !toastText || !toastAction || !storyWrap || !storyLink || !leave || !decor ||
      pvOrNull.some((e) => !e) || items.length !== n
    ) return;
    const pv = pvOrNull as HTMLElement[];
    const infoPanel = [infoRef.current, panelRef.current] as HTMLElement[];

    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const D = (v: number) => (rm ? 0 : v);
    const idle = () => dormantRef.current; // Entry on top → the Wall is a backdrop, not interactive

    // Wall chrome that fades with the product view: hello copy, tag, foot, "Our story ↓".
    const chromeBits = [tag, foot, storyWrap];
    const neon = createNeon(decor.neon, rm);
    let neonTimer = 0;
    let liveAt = 0;
    let mode: "wall" | "zoom" = "wall";
    let cur = 0;
    let busy = false;
    let dragged = false;
    // per-design box aspect ratio (wall.ar of its first colourway) — falls back to the default
    const ars = designs.map((d) => d.products[0].wall.ar ?? AR);
    const slugOf = (i: number) => designs[i].products[store.get().pick[i]].slug;
    let L: Layout = computeLayout(innerWidth, innerHeight, ars);

    const fitOf = (i: number) => items[i].querySelector<HTMLElement>("[data-fit]")!;
    const shOf = (i: number) => items[i].querySelector<HTMLElement>("[data-sh]")!;

    // ── layout: position the wall in px (and snap the camera if zoomed) ────
    const applyLayout = () => {
      L = computeLayout(innerWidth, innerHeight, ars);
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
      applyDecor(decor, computeDecor(L, innerWidth, innerHeight));
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
      // the dressing, lamps and cones go with the other tees
      if (L.mob) gsap.to(decorAll(decor), { opacity: on ? 0 : 1, duration: D(on ? 0.4 : 0.6), delay: D(on ? 0 : 0.25) });
    };

    const showPV = (on: boolean, delay = 0) => {
      gsap.to(pv, { autoAlpha: on ? 1 : 0, duration: D(on ? 0.55 : 0.25), delay: D(delay), ease: "power2.out", stagger: on ? 0.04 : 0 });
      gsap.to([hello, ...chromeBits], { autoAlpha: on ? 0 : 1, duration: D(0.35), delay: D(on ? 0 : 0.55) });
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

    /** Choose colourway j of the design on screen: crossfade the art + shadow (0.18s out, 0.35s in). */
    const pickCw = (j: number) => {
      if (mode !== "zoom") return;
      const i = cur;
      const st = store.get();
      if (st.pick[i] === j) return;
      const pick = st.pick.slice(); pick[i] = j;
      store.set({ pick });                       // label, swatches, price, add-to-bag follow at once
      setUrl(slugOf(i));
      const swap = () => { const art = store.get().art.slice(); art[i] = j; flushSync(() => store.set({ art })); };
      const f = fitOf(i), sh = shOf(i);
      gsap.killTweensOf([f, sh]);
      if (rm) { swap(); gsap.set(f, { opacity: 1 }); gsap.set(sh, { opacity: 0.75 }); return; }
      gsap.to([f, sh], {
        opacity: 0, duration: 0.18,
        onComplete: () => { swap(); gsap.to(f, { opacity: 1, duration: 0.35 }); gsap.to(sh, { opacity: 0.75, duration: 0.35 }); },
      });
    };

    const open = (i: number) => {
      if (busy || idle()) return;
      warmFronts();
      busy = true; mode = "zoom"; cur = i;
      store.set({ zoomed: true, cur: i, side: "back", hover: -1 });
      scroller.style.overflowY = "hidden";
      scroller.style.touchAction = "none";
      const t = cameraTarget(L, i, scroller.scrollTop);
      gsap.to(world, { x: t.x, y: t.y, scale: t.s, duration: D(1.35), ease: "expo.inOut", onComplete: () => { busy = false; } });
      gsap.to(bg, { scale: bgScale(t), duration: D(1.35), ease: "expo.inOut" });
      showPV(true, 0.75);
      isolate(true);
      setUrl(slugOf(i));
    };

    const go = (i: number) => {
      if (busy || i === cur) return;
      busy = true;
      if (store.get().side === "front") swapSide("back", true);
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
      setUrl(slugOf(next));
    };

    const close = () => {
      if (busy || mode !== "zoom") return;
      busy = true;
      if (store.get().side === "front") swapSide("back", true);
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

    /** Instant, un-animated close (going dormant, e.g. walking back out of the Wall). */
    const closeInstant = () => {
      gsap.killTweensOf([world, bg, ...pv, ...items, ...infoPanel, ...decorAll(decor)]);
      items.forEach((_, k) => { gsap.killTweensOf([fitOf(k), shOf(k)]); });
      store.set({ zoomed: false, side: "back", art: store.get().pick.slice() });
      gsap.set(pv, { autoAlpha: 0 });
      gsap.set(items, { opacity: 1 });
      gsap.set(decorAll(decor), { opacity: 1 });
      gsap.set(world, { x: 0, y: 0, scale: 1 });
      gsap.set(bg, { scale: 1, x: 0, y: 0 });
      gsap.set(hello, { autoAlpha: 1 });
      scroller.scrollTop = 0;
      scroller.style.overflowY = L.scrollable ? "auto" : "hidden";
      scroller.style.touchAction = "";
      mode = "wall"; busy = false;
      setUrl(null);
    };

    /** Deep link (/?fit=slug): land zoomed with no animation, on the colourway the slug names. */
    const openInstant = (i: number, j: number) => {
      cur = i; mode = "zoom";
      const pick = store.get().pick.slice(), art = store.get().art.slice();
      pick[i] = j; art[i] = j;
      store.set({ zoomed: true, cur: i, side: "back", hover: -1, pick, art });
      scroller.style.overflowY = "hidden";
      scroller.style.touchAction = "none";
      const t = cameraTarget(L, i, 0);
      gsap.set(world, { x: t.x, y: t.y, scale: t.s });
      gsap.set(bg, { scale: bgScale(t) });
      gsap.set(pv, { autoAlpha: 1 });
      gsap.set([hello, ...chromeBits], { autoAlpha: 0 });
      if (L.mob) {
        items.forEach((e, k) => { gsap.set(e, { opacity: k === i ? 1 : 0 }); });
        gsap.set(decorAll(decor), { opacity: 0 });
      }
    };

    const toast = (text: string, action?: { label: string; href: string }) => {
      toastText.textContent = text;
      if (action) {
        toastAction.textContent = action.label;
        toastAction.setAttribute("href", action.href);
        toastAction.style.display = "";
      } else toastAction.style.display = "none";
      gsap.killTweensOf(toastEl);
      gsap.timeline()
        .to(toastEl, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" })
        .to(toastEl, { autoAlpha: 0, y: -10, duration: 0.35, delay: action ? 3.4 : 1.8 }); // long enough to reach the link
    };

    // ── to the story room ─────────────────────────────────────────────────
    // Fade to the room colour, then push. If the navigation hasn't happened 2.5s later, fade back
    // so the Wall never stays black.
    let leaving = false;
    let leaveTimer = 0;
    const toStory = () => {
      if (leaving || idle()) return;
      leaving = true;
      routerRef.current.prefetch("/story");
      gsap.to(leave, {
        autoAlpha: 1, duration: D(0.6), ease: "power2.in",
        onComplete: () => {
          routerRef.current.push("/story");
          leaveTimer = window.setTimeout(() => { leaving = false; gsap.to(leave, { autoAlpha: 0, duration: 0.3 }); }, 2500);
        },
      });
    };
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) { leaving = false; gsap.set(leave, { autoAlpha: 0 }); } };
    addEventListener("pageshow", onPageShow);

    const bagNum = bagNumRef.current;

    api.current = {
      open,
      pick: pickCw,
      step: (d) => { if (mode === "zoom") go(cur + d); },
      goTo: (i) => { if (mode === "zoom") go(i); },
      close,
      side: (sd) => swapSide(sd),
      hover: (i) => { if (mode === "wall" && !idle()) store.set({ hover: i }); },
      toast,
      teaser: () => { if (mode === "wall" && !idle()) toast(W.decor.teaser.toast, { label: W.decor.teaser.action, href: W.decor.teaser.actionHref }); },
      story: toStory,
      bagBounce: () => {
        if (bagNum) gsap.fromTo(bagNum, { y: -8, opacity: 0 }, { y: 0, opacity: 1, duration: D(0.4), ease: "back.out(3)" });
      },
      dragging: () => dragged,
    };

    // ── gestures ───────────────────────────────────────────────────────────
    // Walking back out: only in wall mode (not zoomed), at the top of the Wall.
    let exiting = false;
    const exitUp = () => {
      if (exiting || idle() || mode !== "wall" || busy || !exitRef.current) return;
      exiting = true;
      exitRef.current();
    };
    let uacc = 0, wacc = 0, wt = 0;
    const onWheel = (e: WheelEvent) => {
      if (idle() || mode !== "wall" || busy) return;
      // Still coasting from the walk in: swallow it, and keep the window open while input keeps arriving.
      if (performance.now() - liveAt < 1600) { liveAt = performance.now(); return; }
      clearTimeout(wt);
      wt = window.setTimeout(() => { uacc = 0; wacc = 0; gsap.to(storyLink, { y: 0, duration: 0.3 }); }, 350);
      if (e.deltaY < 0 && scroller.scrollTop <= 0) { uacc -= e.deltaY; if (uacc > 90) { uacc = 0; exitUp(); } return; }
      if (L.mob || L.scrollable) return; // phones use the link / nav; a scrollable wall scrolls
      if (e.deltaY > 0) {
        uacc = 0;
        wacc += e.deltaY;
        gsap.to(storyLink, { y: -Math.min(wacc, 260) / 12, duration: 0.2 });
        if (wacc > 260) { wacc = 0; toStory(); }
      }
    };
    let ty0: number | null = null;
    const onTouchStart = (e: TouchEvent) => { ty0 = scroller.scrollTop <= 0 ? e.touches[0].clientY : null; };
    const onTouchMove = (e: TouchEvent) => {
      if (ty0 === null || idle() || mode !== "wall") return;
      if (e.touches[0].clientY - ty0 > 70) { ty0 = null; exitUp(); }
    };
    const onTouchEnd = () => { ty0 = null; };

    const onKey = (e: KeyboardEvent) => {
      if (!idle() && mode === "wall" && (e.key === "ArrowUp" || e.key === "PageUp") && scroller.scrollTop <= 0) { exitUp(); return; }
      if (idle() || mode !== "zoom") return;
      // arrow keys inside the size select change the option, not the fit
      if ((e.target as HTMLElement | null)?.closest?.("select, input, textarea")) return;
      if (e.key === "ArrowRight") go(cur + 1);
      else if (e.key === "ArrowLeft") go(cur - 1);
      else if (e.key === "Escape") close();
    };
    let sx: number | null = null, sy = 0;
    const onDown = (e: PointerEvent) => {
      if (idle() || mode !== "zoom" || (e.target as Element | null)?.closest?.("[data-nodrag]")) return;
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
    addEventListener("wheel", onWheel, { passive: true });
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchmove", onTouchMove, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    addEventListener("pointerdown", onDown);
    addEventListener("pointermove", onMove);
    addEventListener("pointerup", onUp);
    addEventListener("pointercancel", onCancel);
    addEventListener("resize", onResize);

    // The wall shows backs; fronts are only seen after a flip, and the other colourway only after a
    // swatch click — both need the product view, so warm them (and their shadows) the first time a
    // fit is opened, not on page load.
    let warmed = false;
    const warmFronts = () => {
      if (warmed) return;
      warmed = true;
      const warm = new Set<string>();
      designs.forEach((d) => d.products.forEach((p) => {
        warm.add(p.wall.front); warm.add(p.wall.frontShadow); warm.add(p.wall.back); warm.add(p.wall.backShadow);
      }));
      warm.forEach((src) => { const im = new Image(); im.src = src; });
    };

    // ── start ──────────────────────────────────────────────────────────────
    applyLayout();
    gsap.set(world, { transformOrigin: "0 0" });
    gsap.set(pv, { autoAlpha: 0 });

    let intro: gsap.core.Timeline | null = null;
    let reveal: gsap.core.Tween | null = null;

    /** The Wall's own opening: deep link (/?fit=slug), or the lights-on intro, or nothing. */
    const start = () => {
      // The Wall was held under the Entry with its chrome hidden (inline autoAlpha:0). Every path
      // out of the hold must begin from a visible baseline, or a `from()` tween would animate
      // 0 → 0 and the header / tag / foot stay hidden for good. Zoomed deep links re-hide tag/foot below.
      gsap.set([header, ...chromeBits], { clearProps: "opacity,visibility,transform" });
      const fitParam = new URLSearchParams(window.location.search).get("fit");
      const deep = fitParam ? findWallSlug(designs, fitParam) : null;
      if (deep) {
        gsap.set(blackout, { autoAlpha: 0 });
        warmFronts();
        openInstant(deep.design, deep.colourway);
        neon.set(true, true);
      } else if (rm || lightsSeen()) {
        // returning visitor (?entered-style landing): the tube flicks on
        gsap.set(blackout, { autoAlpha: 0 });
        neon.set(true, true);
      } else {
        intro = playLightsOn({
          blackout,
          fits: items.map((_, i) => fitOf(i)),
          shadows: items.map((_, i) => shOf(i)),
          chrome: [hello, header, tag, foot, storyWrap],
          onNeon: () => neon.set(true, true),
        });
      }
    };

    /** Entry → Wall handover (wall.html?entered=1): the Wall is already on screen at 1:1,
     *  so only the chrome arrives — header / tag / foot fade in (y −6 → 0). */
    const revealChrome = () => {
      const chrome = [header, ...chromeBits];
      // …and the tube flicks on as you duck in under the shutter
      clearTimeout(neonTimer);
      neonTimer = window.setTimeout(() => neon.set(true, true), 250);
      reveal = gsap.fromTo(
        chrome,
        { autoAlpha: 0, y: rm ? 0 : -6 },
        { autoAlpha: 1, y: 0, duration: rm ? 0.6 : 0.9, stagger: rm ? 0 : 0.08, delay: rm ? 0 : 0.15, ease: "power2.out", clearProps: "transform" },
      );
    };

    /** Hold: the Entry is on top (or the visitor walked back out). The Wall sits at rest, chrome hidden. */
    const sleep = () => {
      intro?.kill(); reveal?.kill(); intro = null; reveal = null;
      if (mode === "zoom") closeInstant();
      gsap.killTweensOf([header, ...chromeBits, blackout, toastEl]);
      clearTimeout(neonTimer);
      neon.set(false);
      scroller.scrollTop = 0;
      store.set({ hover: -1 });
      // a lights-on intro killed mid-way must not leave fits dropped / invisible
      gsap.set(items.map((_, i) => fitOf(i)), { opacity: 1, clearProps: "transform" });
      gsap.set(items.map((_, i) => shOf(i)), { opacity: 0.75 });
      gsap.set(blackout, { autoAlpha: 0 });
      gsap.set([header, ...chromeBits], { autoAlpha: 0 });
      leaving = false; clearTimeout(leaveTimer); gsap.set(leave, { autoAlpha: 0 });
    };
    let woke = false;
    const wake = (handoffNow: boolean) => {
      exiting = false;
      liveAt = performance.now();
      const first = !woke;
      woke = true;
      if (first && !handoffNow) start(); else revealChrome();
    };

    lifecycle.current = { wake, sleep };
    if (dormantRef.current) sleep(); else wake(false);

    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("wheel", onWheel);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchmove", onTouchMove);
      scroller.removeEventListener("touchend", onTouchEnd);
      clearTimeout(wt);
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerup", onUp);
      removeEventListener("pointercancel", onCancel);
      removeEventListener("resize", onResize);
      clearTimeout(rt);
      clearTimeout(neonTimer);
      clearTimeout(leaveTimer);
      removeEventListener("pageshow", onPageShow);
      neon.dispose();
      intro?.kill();
      reveal?.kill();
      lifecycle.current = null;
      gsap.killTweensOf([world, bg, toastEl, leave, storyLink, ...pv, ...items, ...decorAll(decor), hello, ...chromeBits, header]);
      api.current = null;
    };
  }, [n, designs, store]);

  const currentDesign = designs[view.cur] ?? designs[0];
  const current = currentDesign.products[view.pick[view.cur] ?? 0];
  const lit = view.hover >= 0 ? designs[view.hover] : null;

  return (
    <div className={s.app} data-entering={dormant ? "" : undefined} inert={dormant} aria-hidden={dormant ? true : undefined} style={dormant ? { pointerEvents: "none" } : undefined}>
      <div ref={bgRef} className={s.bg} />
      <div ref={scrollerRef} className={s.scroller} data-wall-scroller>
        <div ref={worldRef} className={s.world}>
          <div ref={helloRef} className={s.hello}>
            <div className={`${s.eb} ${s.mono}`}>{W.hello.eyebrow}</div>
            <h2>{W.hello.title}</h2>
          </div>
          <WallDressing
            n={n}
            hover={view.hover}
            price={designs[0].products[0].price}
            gsm={designs[0].gsm}
            depositPercent={designs[0].products[0].depositPercent}
            onTeaser={() => api.current?.teaser()}
          />
          {designs.map((d, i) => (
            <WallItem
              key={d.design}
              ref={(el) => { itemRefs.current[i] = el; }}
              product={d.products[view.art[i] ?? 0]}
              deferArt={i >= FIRST_SCREEN}
              on={view.hover === i}
              showFront={view.side === "front" && view.cur === i}
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
        onStory={() => api.current?.story()}
      />

      <div ref={tagRef} className={s.tag}>
        <div className={s.n}>{lit ? W.tag.no(lit.code ?? "") : W.tag.pour}</div>
        <div className={`${s.s} ${s.mono}`}>{lit ? lit.name : W.tag.sub(n, designs[0]?.gsm ?? 0)}</div>
      </div>
      <div ref={footRef} className={`${s.foot} ${s.mono}`}>{W.foot}</div>
      <div ref={storyWrapRef} className={s.storyWrap}>
        <Link
          ref={storyLinkRef}
          href={W.decor.storyLink.href}
          prefetch={false}
          className={`${s.storyLink} ${s.mono}`}
          onClick={(e) => { e.preventDefault(); api.current?.story(); }}
        >
          {W.decor.storyLink.label} <span aria-hidden="true">↓</span>
        </Link>
      </div>

      <ProductInfo ref={infoRef} product={currentDesign} />
      <BuyPanel
        ref={panelRef}
        design={currentDesign}
        product={current}
        onPick={(j) => api.current?.pick(j)}
        side={view.side}
        onSide={(sd) => api.current?.side(sd)}
        onToast={(t) => api.current?.toast(t)}
        onAdded={() => api.current?.bagBounce()}
      />
      <AisleControls
        prevRef={prevRef}
        nextRef={nextRef}
        countRef={countRef}
        code={currentDesign.code}
        index={view.cur + 1}
        total={n}
        onPrev={() => api.current?.step(-1)}
        onNext={() => api.current?.step(1)}
      />

      <div ref={toastRef} className={s.toast} role="status" aria-live="polite">
        <span ref={toastTextRef} />
        <Link ref={toastActionRef} href="/regulars" prefetch={false} style={{ display: "none" }} />
      </div>
      <div ref={leaveRef} className={s.leave} aria-hidden="true" />
      <Blackout ref={blackoutRef} />
    </div>
  );
}

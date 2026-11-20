"use client";

// The Entry — sky → Delhi → the theka → the Wall, one continuous camera. Ported 1:1 from
// pour001-reference/index.html; geometry lives in entryCamera.ts, the cloud deck in
// SkyCanvas.tsx, the shopfront in StreetScene.tsx.
//
// The doorway is a real hole: <TheWall> is rendered underneath this overlay at 1:1 and shows
// through store_cut.webp's transparent doorway. The Entry NEVER unmounts: it keeps its scroll
// track, and the journey is reversible.
//
//   live     the timeline reached its end (progress ≥ .999): the Wall takes over — interactive, its
//            chrome visible — and the Entry layers are hidden, pointer-events none, aria-hidden.
//   dormant  progress fell back below .985 (a scrollbar drag, or the walk back out): the Wall is a
//            backdrop again and the Entry layers are back.
//   exitUp() the Wall asks to walk back out: go dormant and tween the scroll to maxScroll − 1.4·vh,
//            from where normal scrolling plays the journey in reverse.
//
// Layer order, bottom → top (Wall below this component):
//   skyfb → aerial → cloud canvas → street (+ letterbox backdrop) → vignette → copy/header
//
// Modes of the same component:
//   playing=false  the server-rendered first frame only: night gradient, cloud canvas, header,
//                  wordmark, scroll cue. No journey layers, no effects.
//   playing=true   the journey layers + scroll track mount and the timeline starts.
//   startLive      (returning visitor / ?fit= deep link) start at the END of the track, already live.

import { useEffect, useImperativeHandle, useLayoutEffect, useRef, type Ref } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SkyCanvas, type SkyHandle } from "./SkyCanvas";
import { StreetScene } from "./StreetScene";
import {
  AERIAL_ANCHOR, DUCK_FY, STREET_ANCHOR, aerialBase, camTransform, cssTransform,
  doorwayHoleClip, duckZ, streetBase, type Base, type Cam,
} from "./entryCamera";
import { ENTRY_SKIP_CLASS } from "./entryGate";
import s from "./entry.module.css";

gsap.registerPlugin(ScrollTrigger);

export interface EntryHandle {
  /** The Wall asked to walk back out: go dormant and scroll back into the journey. */
  exitUp: () => void;
}

interface EntryProps {
  ref?: Ref<EntryHandle>;
  /** false → static first frame (server + first client render); true → the journey. */
  playing: boolean;
  /** prefers-reduced-motion, read by Home on the client (always false while not playing). */
  reduced: boolean;
  /** Start at the end of the track, already live (returning visit / deep link). */
  startLive?: boolean;
  /** The Wall is live (true) or dormant (false). */
  onLive: (live: boolean) => void;
}

const ENTRY_ASSETS = ["/theka/entry/aerial.jpg", "/theka/entry/store_cut.webp", "/theka/entry/shutter.jpg", "/theka/entry/scooter.png"];

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
);

/** Park the page's own scroll while the Wall is live: wheel/keys must not walk the journey. */
function parkPageScroll(on: boolean, root: HTMLElement) {
  document.documentElement.classList.toggle("dt-live", on);
  root.toggleAttribute("data-live", on);
  if (on) root.setAttribute("aria-hidden", "true"); else root.removeAttribute("aria-hidden");
}

export function Entry({ ref, playing, reduced: rm, startLive = false, onLive }: EntryProps) {
  const journey = playing && !rm;
  const rootRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<SkyHandle>(null);
  const liveRef = useRef(onLive);
  useLayoutEffect(() => { liveRef.current = onLive; });
  const exitRef = useRef<() => void>(() => {});
  useImperativeHandle(ref, () => ({ exitUp: () => exitRef.current() }), []);

  // Start the photographic layers on mount (after first paint, before anyone can scroll 10%).
  useEffect(() => {
    if (!journey) return;
    const t = window.setTimeout(() => ENTRY_ASSETS.forEach((src) => { const im = new Image(); (im as HTMLImageElement & { fetchPriority: string }).fetchPriority = "low"; im.src = src; }), 0);
    return () => clearTimeout(t);
  }, [journey]);

  // ── reduced motion: no journey, one button ─────────────────────────────────
  useLayoutEffect(() => {
    if (!playing || !rm) return;
    const root = rootRef.current!;
    let live = false;
    const go = (instant: boolean) => {
      if (live) return; live = true;
      parkPageScroll(true, root);
      const done = () => { gsap.set(root, { autoAlpha: 0 }); liveRef.current(true); };
      if (instant) { done(); document.documentElement.classList.remove(ENTRY_SKIP_CLASS); }
      else gsap.to(root, { opacity: 0, duration: 0.6, ease: "power1.inOut", onComplete: done });
    };
    const btn = root.querySelector<HTMLButtonElement>("[data-e=enter]")!;
    const onClick = () => go(false);
    btn.addEventListener("click", onClick);
    if (startLive) go(true);
    return () => { btn.removeEventListener("click", onClick); gsap.killTweensOf(root); parkPageScroll(false, root); };
  }, [playing, rm, startLive]);

  // ── the journey ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!journey) return;
    const root = rootRef.current!;
    const $ = <T extends HTMLElement>(k: string) => root.querySelector<T>(`[data-e=${k}]`)!;
    const track = document.querySelector<HTMLElement>("[data-entry-track]")!;
    const sky = skyRef.current!;
    const P = sky.state;

    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    scrollTo(0, 0);

    const aerialScene = $("aerialScene"), aerial = $("aerial"), skyfb = $("skyfb"), skyWrap = $("sky");
    const street = $("street"), streetScene = $("streetScene"), streetBg = $("streetBg");
    const hero = $("hero"), cue = $("cue"), city = $("city"), store = $("store"), inn = $("inn");
    const shutterwrap = $("shutterwrap"), blue = $("blue"), bloom = $("bloom"), edge = $("edge"), spill = $("spill"), scooter = $("scooter");
    const bar = $("bar"), vig = $("vig"), header = $("header");

    // zoom anchors: the lane's glow, the shop's doorway. k: 0 = the anchor stays put on screen,
    // 1 = the anchor has glided to the screen centre (the duck under the shutter).
    const CAM: { a: Cam; s: Cam } = {
      a: { z: 1, ...AERIAL_ANCHOR, k: 0 },
      s: { z: 1, ...STREET_ANCHOR, k: 0 },
    };
    let baseA: Base, baseS: Base;
    const place = () => {
      const vw = innerWidth, vh = innerHeight;
      baseA = aerialBase(vw, vh);
      baseS = streetBase(vw, vh);
      aerialScene.style.transform = cssTransform(camTransform(baseA, CAM.a, vw, vh));
      const S = camTransform(baseS, CAM.s, vw, vh);
      streetScene.style.transform = cssTransform(S);
      // mobile letterbox backdrop must not cover the doorway: cut the same hole in it
      streetBg.style.clipPath = doorwayHoleClip(S, vw, vh);
    };
    place();

    const ctx = gsap.context(() => {
      // ── live / dormant ──────────────────────────────────────────────────────
      // The scrub is smoothed (1.1s), so the playhead trails the scroll position: liveness is decided
      // by the timeline reaching its end (≥ .999) and released when it falls back below .985.
      let live = false;
      const setLive = (on: boolean, instant = false) => {
        if (on === live) return;
        live = on;
        parkPageScroll(on, root);
        gsap.set([street, vig], { autoAlpha: on ? 0 : 1 });
        if (instant) gsap.set([header, bar], { autoAlpha: on ? 0 : 1 });
        else gsap.to([header, bar], { autoAlpha: on ? 0 : 1, duration: 0.3 });
        liveRef.current(on);
      };

      let keep = 0; // scroll progress just before a refresh re-measures the track
      const tl: gsap.core.Timeline = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => { const p = tl.progress(); if (!live && p >= 0.999) setLive(true); else if (live && p < 0.985) setLive(false); },
        scrollTrigger: {
          trigger: track, start: "top top", end: "bottom bottom", scrub: 1.1,
          onUpdate: (st) => { bar.style.width = `${st.progress * 100}%`; },
          // A refresh (resize, fonts, the Wall mounting underneath) changes the track's pixel
          // length. Hold the *progress*, not the pixel offset, so it can't leap toward the end.
          onRefreshInit: (st) => { keep = st.progress; },
          onRefresh: (st) => {
            if (keep <= 0 || keep >= 1 || Math.abs(st.progress - keep) < 0.001) return;
            scrollTo(0, st.start + keep * (st.end - st.start));
          },
        },
      });
      try {
        if (sessionStorage.getItem("dt_entry_debug") === "1") (window as unknown as { __dtEntry?: unknown }).__dtEntry = { tl };
      } catch { /* storage blocked */ }
      const inv = () => sky.invalidate();

      // 0 → 2.7  fall through the cloud deck; the sky thins away and Delhi shows through the gaps
      tl.to(P, { u: 1, duration: 2.7, ease: "power1.inOut", onUpdate: inv }, 0)
        .to(P, { r: 1, duration: 1.0, ease: "power2.out", onUpdate: inv }, 1.25)
        .to(hero, { opacity: 0, y: -30, duration: 0.6 }, 0.05)
        .to(cue, { opacity: 0, duration: 0.3 }, 0)
        .set(aerial, { opacity: 1 }, 1.2)
        .to(skyWrap, { opacity: 0, duration: 0.5 }, 2.55)
        // 1.2 → 4.4  one long push toward the glowing lane
        .fromTo(CAM.a, { z: 1 }, { z: 2.05, duration: 3.2, ease: "power1.in", onUpdate: place }, 1.2)
        .fromTo(city, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35 }, 2.75)
        .to(city, { opacity: 0, y: -16, duration: 0.3 }, 3.55)
        // 3.8 → 6.0  the lane's glow becomes the shop; slow approach
        .to(street, { opacity: 1, duration: 0.7, ease: "sine.inOut" }, 3.8)
        .fromTo(CAM.s, { z: 1 }, { z: 1.14, duration: 1.3, onUpdate: place }, 3.8)
        .set([aerial, skyfb], { opacity: 0 }, 4.55)
        .to(CAM.s, { z: 1.2, duration: 2.6, onUpdate: place }, 5.1)
        .fromTo(store, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 4.85)
        // 6.1 → 7.0  the shutter jerks halfway up and cold cobalt light floods the lane
        .to(store, { autoAlpha: 0, y: -14, duration: 0.3 }, 6.2)
        .to(shutterwrap, { yPercent: -50, duration: 0.9, ease: "power3.out" }, 6.1)
        .fromTo(shutterwrap, { x: 0 }, { x: 1.4, duration: 0.06, repeat: 7, yoyo: true, ease: "none" }, 6.1)
        .to(blue, { opacity: 1, duration: 0.45, ease: "power2.out" }, 6.15)
        .to(bloom, { opacity: 1, duration: 0.55, ease: "power2.out" }, 6.2)
        .to(spill, { opacity: 1, duration: 0.55 }, 6.25)
        .to(edge, { boxShadow: "0 4px 10px rgba(0,0,0,.6),0 10px 30px rgba(80,140,255,.9)", duration: 0.5 }, 6.2)
        // 7.0 → 7.8  eyes adjust: the glare settles and the tees show through the gap
        .to(blue, { opacity: 0.1, duration: 0.9, ease: "power1.inOut" }, 7.0)
        .to(bloom, { opacity: 0.5, duration: 0.9 }, 7.0)
        // 7.8 → 9.9  duck under the shutter; the wall is already there at full size
        .to(CAM.s, { z: () => duckZ(baseS, innerWidth, innerHeight), fy: DUCK_FY, k: 1, duration: 2.1, ease: "power2.in", onUpdate: place }, 7.8)
        .to([scooter, spill, bloom], { opacity: 0, duration: 0.8 }, 8.4)
        .to(blue, { opacity: 0, duration: 0.6 }, 8.9)
        .fromTo(inn, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4 }, 8.3)
        .to(inn, { opacity: 0, duration: 0.35 }, 9.3)
        .to({}, { duration: 0.35 });

      ScrollTrigger.create({
        trigger: track, start: "top top", end: "bottom bottom",
        onUpdate: () => sky.setActive(tl.time() < 3.1), // clouds are gone after 3.1 — stop drawing
      });

      const maxScroll = () => ScrollTrigger.maxScroll(window);
      /** Jump to the end of the track and go live (skip, and returning visitors). */
      const toEndLive = (instant: boolean) => {
        scrollTo(0, maxScroll());
        tl.progress(1);
        sky.setActive(false);
        setLive(true, instant);
      };

      // walking back out: dormant, then ease into the journey just before the shutter
      exitRef.current = () => {
        if (!live) return;
        setLive(false);
        const o = { y: scrollY };
        gsap.to(o, { y: maxScroll() - innerHeight * 1.4, duration: 1.2, ease: "power2.out", onUpdate: () => scrollTo(0, o.y) });
      };

      const skip = $("skip"), walk = $("walk");
      const onSkip = () => toEndLive(false);
      const onWalk = () => {
        const o = { y: scrollY };
        gsap.to(o, { y: maxScroll(), duration: 4.6, ease: "power1.inOut", onUpdate: () => scrollTo(0, o.y) });
      };
      skip.addEventListener("click", onSkip);
      walk.addEventListener("click", onWalk);

      // Park the page's own scroll while the Wall is live: wheel/keys on the Wall must not drive the
      // journey (the Wall asks for the walk back out itself, through exitUp()).
      const onWheelPark = (e: WheelEvent) => {
        if (!live || e.ctrlKey) return;
        const sc = (e.target as Element | null)?.closest?.<HTMLElement>("[data-wall-scroller]");
        if (sc && sc.scrollHeight > sc.clientHeight + 1 && getComputedStyle(sc).overflowY === "auto") {
          const atTop = sc.scrollTop <= 0, atBottom = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
          if ((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom)) e.preventDefault();
          return;
        }
        e.preventDefault();
      };
      addEventListener("wheel", onWheelPark, { passive: false });

      // Returning visitors and /?fit= deep links start at the end, already live. The sky frame never
      // shows: the pre-paint class hid it; it only comes off once the layers are hidden (live).
      if (startLive) {
        toEndLive(true);
        document.documentElement.classList.remove(ENTRY_SKIP_CLASS);
      }

      let rt = 0;
      const onResize = () => {
        clearTimeout(rt);
        rt = window.setTimeout(() => { place(); tl.invalidate(); ScrollTrigger.refresh(); }, 80);
      };
      addEventListener("resize", onResize);

      return () => {
        skip.removeEventListener("click", onSkip);
        walk.removeEventListener("click", onWalk);
        removeEventListener("wheel", onWheelPark);
        removeEventListener("resize", onResize);
        clearTimeout(rt);
        exitRef.current = () => {};
        parkPageScroll(false, root);
        delete (window as unknown as { __dtEntry?: unknown }).__dtEntry;
      };
    }, root);

    return () => {
      ctx.revert();
      history.scrollRestoration = prevRestoration;
    };
  }, [journey, startLive]);

  return (
    <>
      <div ref={rootRef} className={s.root} data-entry-root>
        <div className={s.stage} aria-hidden="true">
          <div className={`${s.layer} ${s.skyfb}`} data-e="skyfb" />
          {journey && (
            <div className={`${s.layer} ${s.aerial}`} data-e="aerial">
              <div className={s.scene} data-e="aerialScene">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/theka/entry/aerial.jpg" alt="" width={1536} height={864} fetchPriority="low" decoding="async" style={{ left: 0, top: 0, width: 1536, height: 864 }} />
              </div>
            </div>
          )}
          <div className={s.layer}><SkyCanvas ref={skyRef} reduced={rm} /></div>
          {journey && <StreetScene />}
          {journey && <div className={s.vig} data-e="vig" />}
        </div>

        <header className={s.header} data-e="header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className={s.logo}><img src="/brand/logo_glass.png" alt="" width={11} height={20} />DRIP THEKA</div>
          {journey && <button type="button" className={`${s.skip} ${s.mono}`} data-e="skip">Skip to the wall →</button>}
        </header>

        <section className={`${s.copy} ${s.hero}`} data-e="hero">
          <div className={`${s.eb} ${s.mono}`}>Est. MMXXVI · New Delhi</div>
          <h1 className={s.sr}>Drip Theka</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={s.word} src="/brand/logo_word.png" alt="ड्रिप ठेका streetwear" width={1200} height={416} />
          <div className={s.rule} />
          <div className={`${s.sub} ${s.mono}`}>Serving fits, not drinks</div>
          {rm && (
            <button type="button" className={s.enter} data-e="enter">Enter the theka <span className={s.ic}><Arrow /></span></button>
          )}
        </section>

        {!rm && <div className={`${s.cue} ${s.mono}`} data-e="cue"><span>Scroll to descend</span><i /></div>}
        {journey && (
          <>
            <section className={`${s.copy} ${s.city}`} data-e="city">
              <div className={`${s.eb} ${s.mono}`}>Dilli · 1:47 AM</div>
              <p className={s.disp}><span style={{ color: "inherit", whiteSpace: "nowrap" }}>Somewhere down there,</span><br /><span style={{ whiteSpace: "nowrap" }}>one shutter&rsquo;s still up.</span></p>
            </section>
            <section className={`${s.copy} ${s.store}`} data-e="store">
              <div className={`${s.eb} ${s.mono}`}>The Theka · Pour #001</div>
              <h2 className={s.disp}>Now<br />pouring</h2>
              <p>Seven fits on the wall tonight. 400 GSM, oversized, printed in Delhi. Regulars only. Kidding, everyone&rsquo;s a regular.</p>
              <button type="button" className={s.walk} data-e="walk">Walk in <span className={s.ic}><Arrow /></span></button>
            </section>
            <section className={`${s.copy} ${s.inn}`} data-e="inn">
              <p className={s.disp}>Welcome,<br />regular.</p>
              <div className={s.hi}>आइए, बैठिए</div>
            </section>
            <div className={s.bar} data-e="bar" />
          </>
        )}
      </div>
      {journey && <div className={s.track} data-entry-track aria-hidden="true" />}
    </>
  );
}


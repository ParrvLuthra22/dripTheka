"use client";

// The Entry — sky → Delhi → the theka → the Wall, one continuous camera that only
// ever moves forward. Ported 1:1 from entry-reference/index.html; geometry lives in
// entryCamera.ts, the cloud deck in SkyCanvas.tsx, the shopfront in StreetScene.tsx.
//
// The doorway is a real hole: <TheWall> is rendered underneath this overlay at 1:1
// and shows through store_cut.webp's transparent doorway. When the journey ends the
// Entry just unmounts — the Wall is already exactly where it should be.
//
// Layer order, bottom → top (Wall below this component):
//   skyfb → aerial → cloud canvas → street (+ letterbox backdrop) → vignette → copy/header

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SkyCanvas, type SkyHandle } from "./SkyCanvas";
import { StreetScene } from "./StreetScene";
import {
  AERIAL_ANCHOR, STREET_ANCHOR, aerialBase, camTransform, cssTransform,
  doorwayHoleClip, streetBase, walkZ, type Base, type Cam,
} from "./entryCamera";
import s from "./entry.module.css";

gsap.registerPlugin(ScrollTrigger);

export type EntryExit = "complete" | "skip" | "reduced";
interface EntryProps { onDone: (how: EntryExit) => void }

const ENTRY_ASSETS = ["/theka/entry/aerial.jpg", "/theka/entry/store_cut.webp", "/theka/entry/shutter.jpg", "/theka/entry/scooter.png"];

const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
);

export function Entry({ onDone }: EntryProps) {
  const rm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rootRef = useRef<HTMLDivElement>(null);
  const skyRef = useRef<SkyHandle>(null);
  const doneRef = useRef(onDone);
  useLayoutEffect(() => { doneRef.current = onDone; });

  // Start the photographic layers on mount (after first paint, before anyone can scroll 10%).
  useEffect(() => {
    if (rm) return;
    const t = window.setTimeout(() => ENTRY_ASSETS.forEach((src) => { const im = new Image(); (im as HTMLImageElement & { fetchPriority: string }).fetchPriority = "low"; im.src = src; }), 0);
    return () => clearTimeout(t);
  }, [rm]);

  // ── reduced motion: no journey, one button ─────────────────────────────────
  useLayoutEffect(() => {
    if (!rm) return;
    const root = rootRef.current!;
    let gone = false;
    const btn = root.querySelector<HTMLButtonElement>("[data-e=enter]")!;
    const onClick = () => {
      if (gone) return; gone = true;
      gsap.to(root, { opacity: 0, duration: 0.6, ease: "power1.inOut", onComplete: () => doneRef.current("reduced") });
    };
    btn.addEventListener("click", onClick);
    return () => { btn.removeEventListener("click", onClick); gsap.killTweensOf(root); };
  }, [rm]);

  // ── the journey ────────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (rm) return;
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
    const shutterwrap = $("shutterwrap"), warm = $("warm"), spill = $("spill"), scooter = $("scooter");
    const bar = $("bar"), vig = $("vig"), header = $("header");

    // zoom anchors: the lane's glow, the shop's doorway
    const CAM: { a: Cam; s: Cam } = {
      a: { z: 1, ...AERIAL_ANCHOR },
      s: { z: 1, ...STREET_ANCHOR },
    };
    let baseA: Base, baseS: Base;
    const place = () => {
      const vw = innerWidth, vh = innerHeight;
      baseA = aerialBase(vw, vh);
      baseS = streetBase(vw, vh);
      aerialScene.style.transform = cssTransform(camTransform(baseA, CAM.a));
      const S = camTransform(baseS, CAM.s);
      streetScene.style.transform = cssTransform(S);
      // mobile letterbox backdrop must not cover the doorway: cut the same hole in it
      streetBg.style.clipPath = doorwayHoleClip(S, vw, vh);
    };
    place();

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: track, start: "top top", end: "bottom bottom", scrub: 1.1,
          onUpdate: (st) => {
            bar.style.width = `${st.progress * 100}%`;
            if (st.progress > 0.992) finish("complete");
          },
        },
      });
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
        // 3.8 → 4.5  the lane's glow becomes the shop's glow (forward momentum never stops)
        .to(street, { opacity: 1, duration: 0.7, ease: "sine.inOut" }, 3.8)
        .fromTo(CAM.s, { z: 1 }, { z: 1.14, duration: 1.3, onUpdate: place }, 3.8)
        .set([aerial, skyfb], { opacity: 0 }, 4.55)
        .to(CAM.s, { z: 1.2, duration: 2.6, onUpdate: place }, 5.1)
        .fromTo(store, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4 }, 4.85)
        // 6.1 → 7.4  shutter rolls up on the lit wall
        .to(store, { opacity: 0, y: -14, duration: 0.3 }, 6.25)
        .to(shutterwrap, { yPercent: -94, duration: 1.3, ease: "power1.inOut" }, 6.1)
        .to(warm, { opacity: 0.25, duration: 1.3 }, 6.2)
        .to(spill, { opacity: 1, duration: 1.1 }, 6.3)
        // 7.4 → 9.7  walk through the door; the Wall is already there at full size
        .to(CAM.s, { z: () => walkZ(baseS, innerWidth, innerHeight), duration: 2.1, ease: "power2.in", onUpdate: place }, 7.6)
        .to([scooter, spill], { opacity: 0, duration: 0.8 }, 8.1)
        .to(warm, { opacity: 0, duration: 0.8 }, 8.4)
        .fromTo(inn, { opacity: 0, scale: 0.96 }, { opacity: 1, scale: 1, duration: 0.4 }, 8.1)
        .to(inn, { opacity: 0, duration: 0.35 }, 9.1)
        // handoff polish (not in the reference): the vignette and Entry header leave with the walk,
        // so the frame the Wall inherits has no Entry on it → no visible step at the handover.
        .to(vig, { opacity: 0, duration: 0.8 }, 8.9)
        .to(header, { opacity: 0, duration: 0.5 }, 9.2)
        .to({}, { duration: 0.3 });

      ScrollTrigger.create({
        trigger: track, start: "top top", end: "bottom bottom",
        onUpdate: () => sky.setActive(tl.time() < 3.1), // clouds are gone after 3.1 — stop drawing
      });

      let gone = false;
      function finish(how: EntryExit) {
        if (gone) return;
        gone = true;
        doneRef.current(how);
      }

      const skip = $("skip"), walk = $("walk");
      const onSkip = () => {
        if (gone) return;
        gone = true;
        gsap.to(root, { opacity: 0, duration: 0.4, onComplete: () => doneRef.current("skip") });
      };
      const onWalk = () => {
        const end = document.documentElement.scrollHeight - innerHeight, o = { y: scrollY };
        gsap.to(o, { y: end, duration: 4.6, ease: "power1.inOut", onUpdate: () => scrollTo(0, o.y) });
      };
      skip.addEventListener("click", onSkip);
      walk.addEventListener("click", onWalk);

      let rt = 0;
      const onResize = () => {
        clearTimeout(rt);
        rt = window.setTimeout(() => { place(); tl.invalidate(); ScrollTrigger.refresh(); }, 80);
      };
      addEventListener("resize", onResize);
      const onShow = (e: PageTransitionEvent) => { if (e.persisted) { gone = false; scrollTo(0, 0); gsap.set(root, { opacity: 1 }); } };
      addEventListener("pageshow", onShow);

      return () => {
        skip.removeEventListener("click", onSkip);
        walk.removeEventListener("click", onWalk);
        removeEventListener("resize", onResize);
        removeEventListener("pageshow", onShow);
        clearTimeout(rt);
      };
    }, root);

    return () => {
      ctx.revert();
      history.scrollRestoration = prevRestoration;
    };
  }, [rm]);

  return (
    <>
      <div ref={rootRef} className={s.root} data-entry-root>
        <div className={s.stage} aria-hidden="true">
          <div className={`${s.layer} ${s.skyfb}`} data-e="skyfb" />
          {!rm && (
            <div className={`${s.layer} ${s.aerial}`} data-e="aerial">
              <div className={s.scene} data-e="aerialScene">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/theka/entry/aerial.jpg" alt="" width={1536} height={864} fetchPriority="low" decoding="async" style={{ left: 0, top: 0, width: 1536, height: 864 }} />
              </div>
            </div>
          )}
          <div className={s.layer}><SkyCanvas ref={skyRef} reduced={rm} /></div>
          {!rm && <StreetScene />}
          {!rm && <div className={s.vig} data-e="vig" />}
        </div>

        <header className={s.header} data-e="header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className={s.logo}><img src="/brand/logo_glass.png" alt="" width={11} height={20} />DRIP THEKA</div>
          {!rm && <button type="button" className={`${s.skip} ${s.mono}`} data-e="skip">Skip to the wall →</button>}
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

        {!rm && (
          <>
            <div className={`${s.cue} ${s.mono}`} data-e="cue"><span>Scroll to descend</span><i /></div>
            <section className={`${s.copy} ${s.city}`} data-e="city">
              <div className={`${s.eb} ${s.mono}`}>Dilli · 1:47 AM</div>
              <p className={s.disp}><span style={{ color: "inherit", whiteSpace: "nowrap" }}>Somewhere down there,</span><br /><span style={{ whiteSpace: "nowrap" }}>one shutter&rsquo;s still up.</span></p>
            </section>
            <section className={`${s.copy} ${s.store}`} data-e="store">
              <div className={`${s.eb} ${s.mono}`}>The Theka · Pour #001</div>
              <h2 className={s.disp}>Now<br />pouring</h2>
              <p>Ten fits on the wall tonight. 400 GSM, oversized, printed in Delhi. Regulars only. Kidding, everyone&rsquo;s a regular.</p>
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
      {!rm && <div className={s.track} data-entry-track aria-hidden="true" />}
    </>
  );
}


"use client";

// Story — the back wall. Ported 1:1 from story-wall-reference/story.html; every word lives in
// lib/theka/lang.ts under `story.*`.
//
//   wide  (≥ 821px, motion OK)   GSAP ScrollTrigger pins #pin and scrubs the strip left by
//                                (scrollWidth − vw). Each object switches its lamp pool on as it
//                                reaches the middle (containerAnimation), `.rv` elements rise in,
//                                the neon ठेका flickers on while its panel is active, the TV plays
//                                only while its panel is active, a progress line fills.
//   stack (≤ 820px, or reduced   the same panels stacked vertically. Same objects, lamps, neon and
//          motion at any width)  TV behaviour on mobile; reduced motion is fully static (no pin, no
//                                flicker, neon on, reveals static).

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/theka/hooks";
import { lang } from "@/lib/theka/lang";
import s from "./story.module.css";

gsap.registerPlugin(ScrollTrigger);

const T = lang.story;
const H = T.header;

/** A headline whose second half is set in cobalt-light. */
const Hl = ({ t }: { t: { lead: string; accent: string } }): ReactNode => <>{t.lead}<span>{t.accent}</span></>;

/** Where each pinned card sits on the cork (layout, not words). */
const CARDS = [
  { left: "2%", top: "6%", rot: -4 },
  { left: "30%", top: "46%", rot: 3 },
  { left: "56%", top: "2%", rot: -2 },
  { left: "78%", top: "40%", rot: 5 },
] as const;

const WIDE = "(min-width: 821px) and (prefers-reduced-motion: no-preference)";
const STACK = "(max-width: 820px), (prefers-reduced-motion: reduce)";
const REDUCE = "(prefers-reduced-motion: reduce)";
const ROOM = "#2b2627";

export function Story() {
  const hydrated = useHydrated();
  const count = useCartStore((st) => st.items.reduce((t, i) => t + i.quantity, 0));
  const bagCount = hydrated ? count : 0;

  const rootRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const plasterRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLElement>(null);
  const corkRef = useRef<HTMLDivElement>(null);
  const stringsRef = useRef<SVGSVGElement>(null);
  const neonRef = useRef<HTMLDivElement>(null);
  const tubesRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const root = rootRef.current, pin = pinRef.current, strip = stripRef.current, plaster = plasterRef.current;
    const prog = progRef.current, cork = corkRef.current, svg = stringsRef.current;
    const neon = neonRef.current, tubes = tubesRef.current, video = videoRef.current;
    if (!root || !pin || !strip || !plaster || !prog || !cork || !svg || !neon || !tubes || !video) return;

    // the page edges (overscroll) are the room colour too
    const html = document.documentElement;
    const prevBg = html.style.backgroundColor;
    html.style.backgroundColor = ROOM;

    const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-panel]"));
    const rvOf = (p: HTMLElement) => Array.from(p.querySelectorAll<HTMLElement>("[data-rv]"));
    const panel = (id: string) => root.querySelector<HTMLElement>(`[data-panel="${id}"]`)!;

    // ── the neon ठेका ────────────────────────────────────────────────────
    let neonTl: gsap.core.Timeline | null = null;
    const lit = (on: boolean) => { neon.classList.toggle(s.off, !on); neon.dataset.lit = on ? "true" : "false"; };
    const neonOn = (on: boolean, reduced: boolean) => {
      neonTl?.kill(); neonTl = null;
      if (reduced) { lit(true); gsap.set(tubes, { opacity: 1 }); return; }
      if (on) {
        neonTl = gsap.timeline()
          .call(() => lit(true)).to({}, { duration: 0.07 })
          .call(() => lit(false)).to({}, { duration: 0.12 })
          .call(() => lit(true)).to({}, { duration: 0.05 })
          .call(() => lit(false)).to({}, { duration: 0.18 })
          .call(() => lit(true)).to(tubes, { opacity: 1, duration: 0.6 });
      } else {
        lit(false);
        gsap.to(tubes, { opacity: 0, duration: 0.3 });
      }
    };

    // ── the strings between the pinned cards ────────────────────────────
    // Drawn from where each pin really sits on the cork. A card is rotated about its centre and is
    // also mid-reveal (y/rotation tween) for a while, so the pin is placed from the card's layout
    // box + its resting rotation — not from getBoundingClientRect, which would follow the tween.
    const strings = () => {
      if (getComputedStyle(svg).display === "none") return;
      const cards = Array.from(cork.querySelectorAll<HTMLElement>("[data-card]"));
      const pins = cards.map((c) => {
        const rot = (Number(c.dataset.rot) * Math.PI) / 180;
        const cx = c.offsetLeft + c.offsetWidth / 2, cy = c.offsetTop + c.offsetHeight / 2, half = c.offsetHeight / 2;
        // the pin's centre is the card's top-centre edge: (0, −h/2) from the centre, rotated by θ
        return [cx + half * Math.sin(rot), cy - half * Math.cos(rot)] as const;
      });
      svg.setAttribute("viewBox", `0 0 ${cork.offsetWidth} ${cork.offsetHeight}`);
      svg.querySelectorAll("path").forEach((path, i) => {
        const a = pins[i], b = pins[i + 1];
        if (!a || !b) return;
        const mx = (a[0] + b[0]) / 2, my = Math.max(a[1], b[1]) + 40;
        path.setAttribute("d", `M${a[0]},${a[1]} Q${mx},${my} ${b[0]},${b[1]}`);
      });
    };

    const mm = gsap.matchMedia();
    mm.add({ wide: WIDE, stack: STACK, reduce: REDUCE }, (ctx) => {
      const { wide, reduce } = ctx.conditions as { wide: boolean; stack: boolean; reduce: boolean };

      if (wide) {
        // ── pinned horizontal walk ───────────────────────────────────────
        const dist = () => Math.max(0, strip.scrollWidth - innerWidth);
        const sizePlaster = () => { plaster.style.width = `${strip.scrollWidth}px`; };
        sizePlaster();
        ScrollTrigger.addEventListener("refreshInit", sizePlaster);

        const walk = gsap.to(strip, {
          x: () => -dist(), ease: "none",
          scrollTrigger: {
            trigger: pin, pin: true, scrub: 1, end: () => `+=${dist()}`, invalidateOnRefresh: true,
            onUpdate: (st) => { prog.style.width = `${st.progress * 100}%`; },
          },
        });

        // each object switches its lamp on as it reaches the middle of the wall
        panels.forEach((p, idx) => {
          const pool = p.querySelector<HTMLElement>("[data-pool]");
          if (pool) {
            // The last panel can never reach the middle (the wall ends first), so its lamp is full
            // once the wall has run out: end at its right edge instead of its centre.
            const end = idx === panels.length - 1 ? "right right" : "center center";
            gsap.fromTo(pool, { opacity: 0.12 }, {
              opacity: 1, ease: "none",
              scrollTrigger: { trigger: p, containerAnimation: walk, start: "left 80%", end, scrub: true },
            });
          }
          rvOf(p).forEach((el, k) => {
            gsap.from(el, {
              y: 40, opacity: 0, rotate: "+=3", duration: 1, ease: "expo.out", delay: k * 0.08,
              scrollTrigger: { trigger: p, containerAnimation: walk, start: "left 70%", toggleActions: "play none none reverse" },
            });
          });
        });
        // the strings fade up with the cards they join
        gsap.from(svg, {
          opacity: 0, duration: 1, ease: "expo.out", delay: 0.3,
          scrollTrigger: { trigger: panel("p3"), containerAnimation: walk, start: "left 70%", toggleActions: "play none none reverse" },
        });

        ScrollTrigger.create({ trigger: panel("p4"), containerAnimation: walk, start: "left 55%", end: "right 45%", onToggle: (st) => neonOn(st.isActive, false) });
        ScrollTrigger.create({
          trigger: panel("p7"), containerAnimation: walk, start: "left 70%", end: "right 30%",
          onToggle: (st) => { if (st.isActive) video.play().catch(() => {}); else video.pause(); },
        });
        // plaster drifts slower than the panels
        gsap.to(plaster, { x: () => dist() * 0.08, ease: "none", scrollTrigger: { trigger: pin, scrub: true, start: "top top", end: () => `+=${dist()}`, invalidateOnRefresh: true } });

        requestAnimationFrame(strings);
        const onRefresh = () => strings();
        ScrollTrigger.addEventListener("refresh", onRefresh);
        addEventListener("resize", strings);
        return () => {
          plaster.style.width = "";
          ScrollTrigger.removeEventListener("refreshInit", sizePlaster);
          ScrollTrigger.removeEventListener("refresh", onRefresh);
          removeEventListener("resize", strings);
        };
      }

      // ── stacked wall (phones, and reduced motion at every width) ───────
      if (reduce) {
        // fully static: lamps lit, neon on, reveals as they are, the TV is the viewer's to start
        gsap.set(panels.map((p) => p.querySelector("[data-pool]")).filter(Boolean), { opacity: 1 });
        neonOn(true, true);
        video.controls = true;
        return () => { video.controls = false; };
      }
      panels.forEach((p) => {
        const pool = p.querySelector<HTMLElement>("[data-pool]");
        if (pool) {
          gsap.fromTo(pool, { opacity: 0.15 }, {
            opacity: 1,
            scrollTrigger: { trigger: p, start: "top 75%", end: "center center", scrub: true },
          });
        }
        rvOf(p).forEach((el, k) => {
          gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: "expo.out", delay: k * 0.08, scrollTrigger: { trigger: el, start: "top 88%" } });
        });
      });
      ScrollTrigger.create({ trigger: panel("p4"), start: "top 60%", end: "bottom 40%", onToggle: (st) => neonOn(st.isActive, false) });
      ScrollTrigger.create({
        trigger: panel("p7"), start: "top 70%", end: "bottom 30%",
        onToggle: (st) => { if (st.isActive) video.play().catch(() => {}); else video.pause(); },
      });
    }, root);

    // fonts change the strings' geometry (card heights); re-measure once they are in
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) { strings(); ScrollTrigger.refresh(); } });

    return () => {
      alive = false;
      neonTl?.kill();
      video.pause();
      mm.revert();
      html.style.backgroundColor = prevBg;
    };
  }, []);

  return (
    <div ref={rootRef} className={s.app}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
        <filter id="dt-rough"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" /><feDisplacementMap in="SourceGraphic" scale="3" /></filter>
      </svg>

      <header className={s.header}>
        <Link className={s.logo} href={H.wallHref} prefetch={false} aria-label={H.logoAria}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo_glass.png" alt="" width={11} height={20} />
          {lang.brand.wordmark}
        </Link>
        <nav className={s.nav} aria-label={H.navAria}>
          <Link href={H.wallHref} prefetch={false}>{H.wall}</Link>
          <Link href="/story" className={s.act} aria-current="page">{H.story}</Link>
          <Link href={H.lookHref} prefetch={false}>{H.look}</Link>
        </nav>
        <Link className={s.bag} href="/cart" prefetch={false} aria-label={H.bagAria(bagCount)}>{H.bag} ({bagCount})</Link>
      </header>
      <div className={s.vig} />
      <div className={`${s.prog} ${s.mono}`} aria-hidden="true">
        <span>{T.progress}</span><i><b ref={progRef} data-progress /></i>
      </div>

      <main ref={pinRef} className={s.pin}>
        <div ref={stripRef} className={s.strip}>
          <div ref={plasterRef} className={s.plaster} />

          <section className={`${s.panel} ${s.p0}`} data-panel="p0">
            <div className={s.pool} data-pool />
            <div className={s.in}>
              <div className={`${s.eb} ${s.mono}`}>{T.p0.eyebrow}</div>
              <h1 className={s.disp}><Hl t={T.p0.title} /></h1>
              <div className={`${s.go} ${s.mono}`}><span>{T.p0.go}</span><i /></div>
            </div>
          </section>

          <section className={`${s.panel} ${s.p1}`} data-panel="p1">
            <div className={s.lamp} /><div className={s.pool} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p1.chapter.n}</b> · {T.p1.chapter.label}</div>
            <div className={s.bill} data-rv>
              <div className={s.tape} />
              <h4>{T.p1.bill.title}</h4><div className={s.c}>{T.p1.bill.sub}</div><hr />
              {T.p1.bill.done.map((r) => <div key={r.k} className={s.r}><span>{r.k}</span><span>{r.v}</span></div>)}
              <div className={s.r}><s>{T.p1.bill.struck.k}</s><span>{T.p1.bill.struck.v}</span></div><hr />
              <div className={s.r}><b>{T.p1.bill.status.k}</b><b>{T.p1.bill.status.v}</b></div>
              <div className={s.r}><span>{T.p1.bill.giving.k}</span><span>{T.p1.bill.giving.v}</span></div>
              <div className={s.stamp}>{T.p1.bill.stamp}</div>
              <div className={s.note}>{T.p1.bill.note}</div>
            </div>
            <div className={`${s.cap} ${s.disp}`} data-rv><Hl t={T.p1.cap} /></div>
          </section>

          <section className={`${s.panel} ${s.p2}`} data-panel="p2">
            <div className={s.lamp} /><div className={s.pool} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p2.chapter.n}</b> · {T.p2.chapter.label}</div>
            <div className={s.board} data-rv>
              <h3>{T.p2.title}<small>{T.p2.sub}</small></h3>
              <ul className={s.rate}>
                {T.p2.rows.map((r) => (
                  <li key={r.q}><span className={s.q}>{r.q}</span><span className={s.d} /><span className={`${s.a} ${r.big ? s.big : ""}`}>{r.a}</span></li>
                ))}
              </ul>
              <div className={s.chalk} />
            </div>
          </section>

          <section className={`${s.panel} ${s.p3}`} data-panel="p3">
            <div className={s.lamp} /><div className={s.pool} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p3.chapter.n}</b> · {T.p3.chapter.label}</div>
            <div ref={corkRef} className={s.cork}>
              <svg ref={stringsRef} className={s.strings} data-strings preserveAspectRatio="none" aria-hidden="true"><path /><path /><path /></svg>
              {T.p3.cards.map((c, i) => (
                <div
                  key={c.k}
                  className={`${s.card} ${c.blue ? s.b : ""}`}
                  data-rv
                  data-card
                  data-rot={CARDS[i].rot}
                  style={{ left: CARDS[i].left, top: CARDS[i].top, transform: `rotate(${CARDS[i].rot}deg)` }}
                >
                  <i className={s.pinhead} data-pin />
                  <div className={s.k}>{c.k}</div><h5>{c.h}</h5>{c.body}
                </div>
              ))}
            </div>
          </section>

          <section className={`${s.panel} ${s.p4}`} data-panel="p4">
            <div className={s.lamp} /><div className={`${s.pool} ${s.blue}`} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p4.chapter.n}</b> · {T.p4.chapter.label}</div>
            <div className={s.neonwrap}>
              <div ref={tubesRef} className={s.tubes} />
              <div ref={neonRef} className={`${s.neon} ${s.off}`} data-story-neon data-lit="false">{T.p4.neon}</div>
              <div className={s.dict} data-rv>
                <div className={s.pr}>{T.p4.dict.pr}</div>
                <ol>
                  {T.p4.dict.defs.map((d, i) => (
                    <li key={i} data-n={`${i + 1}.`}>
                      <span>
                        {"struck" in d ? <s>{d.struck}</s> : <>{d.lead}<b>{d.em}</b>{d.tail}</>}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </section>

          <section className={`${s.panel} ${s.p5}`} data-panel="p5">
            <div className={s.lamp} /><div className={s.pool} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p5.chapter.n}</b> · {T.p5.chapter.label}</div>
            <div>
              <div className={s.paint} data-rv><Hl t={T.p5.paint} /></div>
              <div className={s.paintSub} data-rv>{T.p5.sub}</div>
            </div>
          </section>

          <section className={`${s.panel} ${s.p6}`} data-panel="p6">
            <div className={s.lamp} /><div className={`${s.pool} ${s.blue}`} data-pool />
            <div className={`${s.ch} ${s.mono}`}>{T.p6.chapter}</div>
            <div className={s.enamel} data-rv>
              <i className={s.rivet} style={{ left: 14, top: 14 }} /><i className={s.rivet} style={{ right: 14, top: 14 }} />
              <i className={s.rivet} style={{ left: 14, bottom: 14 }} /><i className={s.rivet} style={{ right: 14, bottom: 14 }} />
              <div className={s.hq}>{T.p6.hq.lead}<span>{T.p6.hq.accent}</span>{T.p6.hq.tail}</div>
              <div className={s.t}>{T.p6.sub}</div>
              <i className={s.chip} />
            </div>
          </section>

          <section className={`${s.panel} ${s.p7}`} data-panel="p7">
            <div className={`${s.pool} ${s.blue}`} data-pool />
            <div className={`${s.ch} ${s.mono}`}>Chapter <b>{T.p7.chapter.n}</b> · {T.p7.chapter.label}</div>
            <div className={s.tvwrap}>
              <div className={s.tvglow} />
              <div className={s.bracket} />
              <div className={s.tv} data-rv>
                <div className={s.screen}>
                  <video
                    ref={videoRef}
                    src="/theka/story/reveal.mp4"
                    poster="/theka/story/reveal_poster.jpg"
                    muted loop playsInline preload="metadata"
                    aria-label={T.p7.videoAria}
                  />
                </div>
                <div className={s.knobs}><i /><i /></div>
              </div>
              <div className={`${s.tvcap} ${s.disp}`} data-rv><Hl t={T.p7.cap} /></div>
            </div>
          </section>

          <section className={`${s.panel} ${s.p8}`} data-panel="p8">
            <div className={s.lamp} /><div className={s.pool} data-pool />
            <div className={s.in}>
              <h2 className={s.disp} data-rv><Hl t={T.p8.title} /></h2>
              <div className={`${s.sig} ${s.mono}`} data-rv>{T.p8.sig}</div>
              <Link className={s.cta} href={T.p8.ctaHref} prefetch={false} data-rv>
                {T.p8.cta}
                <span className={s.ic}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="m6 3 5 5-5 5" /></svg>
                </span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

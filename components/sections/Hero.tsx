"use client";

// Hero — full viewport, blue background, cream type.
// Three.js HeroPour lazy-loaded on desktop; SVG fallback on mobile.

import { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { WineGlassMark } from "@/components/glass/WineGlassMark";
import { HeroPourFallback } from "@/components/glass/HeroPour";
import { useSoundStore } from "@/lib/store/sound";

gsap.registerPlugin();

// Three.js hero — SSR disabled, load only on desktop
const HeroPour = dynamic(
  () => import("@/components/glass/HeroPour").then((m) => ({ default: m.HeroPour })),
  { ssr: false, loading: () => <HeroPourFallback /> }
);

// Split "DRIP" and "theka" into character spans for per-char GSAP animation
const DRIP  = ["D", "R", "I", "P"];
const THEKA = ["t", "h", "e", "k", "a"];

// Session key — pour animation plays once per browser session
const SESSION_KEY = "dt-hero-played";

export function Hero() {
  const { muted } = useSoundStore();
  const containerRef  = useRef<HTMLElement>(null);
  const dripRef       = useRef<HTMLDivElement>(null);
  const thekaRef      = useRef<HTMLDivElement>(null);
  const taglineRef    = useRef<HTMLParagraphElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const metaRef       = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const dripChars  = dripRef.current?.querySelectorAll(".hero-char");
    const thekaChars = thekaRef.current?.querySelectorAll(".hero-char");
    if (!dripChars || !thekaChars) return;

    const allChars = [...Array.from(dripChars), ...Array.from(thekaChars)];
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);

    if (alreadyPlayed) {
      // Snap to final state — no re-animation on revisit
      gsap.set(allChars,      { yPercent: 0, opacity: 1 });
      gsap.set(taglineRef.current, { opacity: 1, y: 0 });
      gsap.set(ctaRef.current,     { opacity: 1, y: 0 });
      gsap.set(metaRef.current,    { opacity: 1 });
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");

    // Set initial hidden state
    gsap.set(allChars,           { yPercent: 110, opacity: 1 });
    gsap.set(taglineRef.current, { opacity: 0, y: 24 });
    gsap.set(ctaRef.current,     { opacity: 0, y: 16 });
    gsap.set(metaRef.current,    { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.25 });

    // Letters slide up
    tl.to(allChars, {
      yPercent: 0,
      stagger:  0.04,
      duration: 0.9,
      ease:     "power3.out",
    });

    // Tagline
    tl.to(taglineRef.current, {
      opacity:  1,
      y:        0,
      duration: 0.65,
      ease:     "power2.out",
    }, "-=0.35");

    // CTA
    tl.to(ctaRef.current, {
      opacity:  1,
      y:        0,
      duration: 0.5,
      ease:     "power2.out",
    }, "-=0.45");

    // Meta bottom-right
    tl.to(metaRef.current, {
      opacity:  1,
      duration: 0.4,
    }, "-=0.45");

    // Pour sound — fire once, 1.4s after load, only if not muted
    if (!muted) {
      tl.call(() => {
        import("howler").then(({ Howl }) => {
          const h = new Howl({ src: ["/sounds/pour.mp3"], volume: 0.5 });
          h.play();
        }).catch(() => {});
      }, [], 1.4);
    }
  }, { scope: containerRef, dependencies: [muted] });

  return (
    <section
      ref={containerRef}
      data-nav-tone="light"
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ backgroundColor: "#004AAD" }}
      aria-label="Hero"
    >
      {/* ── Top eyebrows ────────────────────────────────────────────── */}
      <div
        className="relative z-10 flex items-center justify-between pt-5 md:pt-7"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/60">
          Pour&nbsp;#001&nbsp;·&nbsp;Opening Night Soon
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/60 hidden sm:block">
          New Delhi&nbsp;·&nbsp;28.6139°N&nbsp;·&nbsp;77.2090°E
        </p>
      </div>

      {/* ── Main grid ────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-[55%_45%] items-center">

        {/* LEFT — text */}
        <div
          className="flex flex-col justify-center gap-8 md:gap-10 py-12 md:py-20"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* Title: DRIP / theka */}
          <div
            className="font-display font-semibold text-[#E4E2DD] leading-[0.85]"
            style={{ fontSize: "clamp(72px, 18vw, 280px)" }}
          >
            {/* DRIP line — overflow-hidden clips the "slide up from below" */}
            <div className="overflow-hidden" ref={dripRef}>
              <div className="flex">
                {DRIP.map((ch, i) => (
                  <span key={i} className="hero-char inline-block">{ch}</span>
                ))}
              </div>
            </div>
            {/* theka line */}
            <div className="overflow-hidden" ref={thekaRef}>
              <div className="flex italic">
                {THEKA.map((ch, i) => (
                  <span key={i} className="hero-char inline-block">{ch}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            className="font-display italic text-[#E4E2DD]/80 leading-tight"
            style={{ fontSize: "clamp(1.5rem, 3vw, 3rem)" }}
          >
            Serving fits, not drinks.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <Link href="/pour/pour-001">
              <Button
                variant="outline"
                size="lg"
                magnetic
                className="border-[#E4E2DD] text-[#E4E2DD] hover:bg-[#E4E2DD] hover:text-[#004AAD]"
              >
                Walk in → Pour #001
              </Button>
            </Link>
          </div>
        </div>

        {/* RIGHT — 3D glass (desktop) / SVG fallback (mobile) */}
        <div className="relative h-full min-h-[340px] md:min-h-0">
          {/* Desktop: lazy Three.js */}
          <div className="hidden md:block absolute inset-0">
            <HeroPour className="w-full h-full" />
          </div>

          {/* Mobile: static SVG */}
          <div className="flex md:hidden items-center justify-center py-8">
            <WineGlassMark
              size={180}
              liquid={72}
              className="text-[#E4E2DD]"
              liquidColor="#E4E2DD"
            />
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────── */}
      <div
        ref={metaRef}
        className="relative z-10 flex items-end justify-between pb-6 md:pb-8"
        style={{ paddingInline: "var(--pad-x)" }}
      >
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/40">
          Drop 001 of ∞
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#E4E2DD]/40">
          Est.&nbsp;MMXXVI&nbsp;·&nbsp;Delhi
        </span>
      </div>

      {/* Subtle grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />
    </section>
  );
}

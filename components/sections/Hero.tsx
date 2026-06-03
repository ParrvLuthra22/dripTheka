"use client";

// Hero — full viewport, blue background, cream type.
// Three.js HeroPour lazy-loaded on desktop; SVG fallback on mobile.

import { useRef } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useSound } from "@/components/sound/SoundProvider";

// Session key — pour animation plays once per browser session
const SESSION_KEY = "dt-hero-played";

export function Hero() {
  const { muted, play } = useSound();
  const containerRef  = useRef<HTMLElement>(null);
  const logoRef       = useRef<HTMLDivElement>(null);
  const taglineRef    = useRef<HTMLParagraphElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const metaRef       = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const logo = logoRef.current;
    const alreadyPlayed = sessionStorage.getItem(SESSION_KEY);

    if (alreadyPlayed) {
      gsap.set(logo,               { opacity: 1, y: 0 });
      gsap.set(taglineRef.current, { opacity: 1, y: 0 });
      gsap.set(ctaRef.current,     { opacity: 1, y: 0 });
      gsap.set(metaRef.current,    { opacity: 1 });
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");

    // Set initial hidden state
    gsap.set(logo,               { opacity: 0, y: 40 });
    gsap.set(taglineRef.current, { opacity: 0, y: 24 });
    gsap.set(ctaRef.current,     { opacity: 0, y: 16 });
    gsap.set(metaRef.current,    { opacity: 0 });

    const tl = gsap.timeline({ delay: 0.2 });

    // Logo slides up + fades in
    tl.to(logo, {
      opacity:  1,
      y:        0,
      duration: 1.0,
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

      {/* ── Main content — Centered ──────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">

        <div
          className="flex flex-col items-center justify-center gap-8 md:gap-10 py-12 md:py-20"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* Logo image — large, centered */}
          <div
            ref={logoRef}
            className="overflow-hidden flex justify-center"
          >
            <Image
              src="/dtlogo-cropped.png"
              alt="Drip Theka"
              width={1412}
              height={564}
              priority
              draggable={false}
              className="select-none pointer-events-none w-full h-auto"
              style={{ maxWidth: "clamp(280px, 60vw, 720px)" }}
            />
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
          <div ref={ctaRef} className="flex justify-center flex-wrap gap-4">
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

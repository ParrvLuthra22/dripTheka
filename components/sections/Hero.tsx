"use client";

// Hero — full viewport, cobalt background, cream type.
//
// The dtlogo image is NOT rendered here — it lives in MorphingLogo (fixed
// position, shared across the page so it can fly into the navbar on scroll).
//
// Hero owns:
//   • Scramble text entrance ("DRIP THEKA" with Devanagari × Latin chars)
//   • An invisible morph anchor (data-morph-anchor="hero") at the position
//     where the real logo SHOULD appear after scramble
//   • Tagline, CTA, eyebrows
//
// Coordination: when scramble completes, Hero dispatches a global event
// (window event "drip-theka:hero-ready") that MorphingLogo listens for.
// For previously-played sessions, the event fires immediately on mount.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/Button";
import { ScrambleText } from "@/components/motion/ScrambleText";
import { FoamParticles } from "@/components/motion/FoamParticles";
import { TextSticker } from "@/components/ui/TextSticker";
import { Sticker } from "@/components/ui/Sticker";
import { Grain } from "@/components/ui/Grain";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { HandText } from "@/components/ui/HandText";
import { useSound } from "@/components/sound/SoundProvider";

const SESSION_KEY = "dt-hero-played";
const READY_EVENT = "drip-theka:hero-ready";

function dispatchReady() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(READY_EVENT));
  }
}

export function Hero() {
  const { muted, play } = useSound();
  const containerRef  = useRef<HTMLElement>(null);
  const taglineRef    = useRef<HTMLParagraphElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const metaRef       = useRef<HTMLDivElement>(null);
  const scrambleRef   = useRef<HTMLDivElement>(null);

  // Track whether the scramble has run; default true if session shows already-played
  const [alreadyPlayed, setAlreadyPlayed] = useState(false);
  const [scrambleDone, setScrambleDone]   = useState(false);

  useGSAP(() => {
    const skip = typeof window !== "undefined"
      ? !!sessionStorage.getItem(SESSION_KEY)
      : false;

    if (skip) {
      setAlreadyPlayed(true);
      setScrambleDone(true);
      if (scrambleRef.current) gsap.set(scrambleRef.current, { opacity: 0, display: "none" });
      if (taglineRef.current) gsap.set(taglineRef.current,  { opacity: 1, y: 0 });
      if (ctaRef.current) gsap.set(ctaRef.current,      { opacity: 1, y: 0 });
      if (metaRef.current) gsap.set(metaRef.current,     { opacity: 1 });
      // Tell MorphingLogo to mount immediately
      dispatchReady();
      return;
    }

    sessionStorage.setItem(SESSION_KEY, "1");

    // Initial hidden state
    if (taglineRef.current) gsap.set(taglineRef.current,  { opacity: 0, y: 24 });
    if (ctaRef.current) gsap.set(ctaRef.current,      { opacity: 0, y: 16 });
    if (metaRef.current) gsap.set(metaRef.current,     { opacity: 0 });

    // Pour sound — fire on hero entrance if sound is on
    if (!muted) {
      gsap.delayedCall(1.6, () => play("pour"));
    }
  }, { scope: containerRef, dependencies: [muted] });

  // Triggered when ScrambleText finishes
  const onScrambleComplete = () => {
    setScrambleDone(true);
    const tl = gsap.timeline();
    // Fade out the scramble text
    tl.to(scrambleRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out",
      onComplete: () => {
        // Now MorphingLogo can take over
        dispatchReady();
      },
    });
    // Reveal the rest
    if (taglineRef.current) tl.to(taglineRef.current, {
      opacity: 1, y: 0,
      duration: 0.65, ease: "power2.out",
    }, "-=0.1");
    if (ctaRef.current) tl.to(ctaRef.current, {
      opacity: 1, y: 0,
      duration: 0.5, ease: "power2.out",
    }, "-=0.45");
    if (metaRef.current) tl.to(metaRef.current, {
      opacity: 1, duration: 0.4,
    }, "-=0.45");
  };

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

      {/* ── Main content — centred ──────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">

        <div
          className="flex flex-col items-center justify-center gap-8 md:gap-10 py-12 md:py-20 w-full"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/*
            Logo slot — has TWO purposes:

              1. While the scramble plays, render ScrambleText absolutely
                 positioned over the same area
              2. After scramble completes, this is the data-morph-anchor="hero"
                 div — MorphingLogo reads its bounding rect and renders the
                 actual dtlogo PNG flying into here.

            The div itself is INVISIBLE — it only carries dimensions for
            measurement. No image lives in it.
          */}
          <div
            data-morph-anchor="hero"
            className="relative w-full"
            style={{
              maxWidth:    "clamp(280px, 60vw, 720px)",
              aspectRatio: "1412 / 564",
            }}
          >
            {/* Scramble text — visible only during entrance, then fades */}
            {!alreadyPlayed && !scrambleDone && (
              <div
                ref={scrambleRef}
                className="absolute inset-0 flex items-center justify-center"
              >
                <ScrambleText
                  text="DRIP THEKA"
                  duration={1300}
                  stagger={60}
                  speed={40}
                  onComplete={onScrambleComplete}
                  className="font-tanker text-[#E4E2DD] whitespace-nowrap uppercase"
                  style={{
                    fontSize:      "clamp(2.5rem, 8vw, 6.5rem)",
                    letterSpacing: "-0.01em",
                    lineHeight:    0.85,
                  }}
                />
              </div>
            )}
          </div>

          {/* Tagline */}
          <p
            ref={taglineRef}
            className="font-display italic text-[#E4E2DD]/80 leading-tight"
            style={{ fontSize: "clamp(1.5rem, 3vw, 3rem)" }}
          >
            Serving{" "}
            <span className="relative inline-block">
              fits
              <ChalkMark variant="underline" color="#E4E2DD" className="absolute -bottom-1 left-0 w-full h-[9px]" />
            </span>
            , not drinks.
          </p>

          {/* CTA */}
          <div ref={ctaRef} className="flex flex-col items-center gap-2">
            <HandText size="sm" rotate={-2} color="#E4E2DD" className="opacity-50 max-sm:hidden">
              first round on us ↓
            </HandText>
            <div className="flex justify-center flex-wrap gap-4">
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

      {/* ── Sticker layer — slapped-on streetwear chaos (desktop only) ──── */}
      <div className="absolute inset-0 z-10 pointer-events-none hidden lg:block" aria-hidden="true">
        <TextSticker variant="stamp" tone="neon" rotate={-12}
          className="absolute left-[5vw] top-[26%]">
          est<br />mmxxvi<br />delhi
        </TextSticker>
        <TextSticker variant="slap" tone="neon" rotate={7}
          className="absolute right-[6vw] top-[30%]">
          no restocks
        </TextSticker>
        <TextSticker variant="tape" tone="cream" rotate={-4}
          className="absolute left-[8vw] bottom-[24%]">
          100% cotton · 0% chill
        </TextSticker>
        <TextSticker variant="slap" tone="cream" rotate={-9}
          className="absolute right-[7vw] bottom-[28%]">
          buy or cry
        </TextSticker>
        {/* SVG decorative stickers */}
        <Sticker variant="made-in-delhi" rotate={8} size={80}
          className="absolute top-[12%] right-[10vw]" />
        <Sticker variant="21-plus" rotate={-7} size={72}
          className="absolute bottom-[16%] left-[8vw]" />
      </div>

      {/* Drifting foam particles behind everything */}
      <FoamParticles />

      {/* Grain texture overlay */}
      <Grain opacity={0.05} />
    </section>
  );
}

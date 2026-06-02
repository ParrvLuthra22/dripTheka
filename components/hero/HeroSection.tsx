"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import dynamic from "next/dynamic";
import Link from "next/link";

gsap.registerPlugin(SplitText);

const WineGlass = dynamic(
  () => import("./WineGlass").then((m) => m.WineGlass),
  { ssr: false }
);

export function HeroSection() {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headlineRef.current || !subRef.current || !ctaRef.current) return;

    const ctx = gsap.context(() => {
      const split = new SplitText(headlineRef.current!, { type: "chars,words" });

      const tl = gsap.timeline({ delay: 0.2 });

      tl.fromTo(
        split.chars,
        { opacity: 0, y: 60, rotateX: -40 },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          stagger: 0.02,
          ease: "power3.out",
        }
      )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.3"
        );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#E4E2DD]">
      {/* Three.js wine glass — full bleed behind text */}
      <div className="absolute inset-0 flex items-center justify-end pr-8 md:pr-16 lg:pr-24 pointer-events-none">
        <div className="w-[300px] h-[450px] md:w-[420px] md:h-[600px] lg:w-[540px] lg:h-[700px]">
          <WineGlass />
        </div>
      </div>

      {/* Decorative drop number */}
      <div
        className="absolute top-24 right-6 md:right-12 font-mono text-[120px] md:text-[180px] lg:text-[220px] leading-none text-[#141518]/5 select-none pointer-events-none"
        aria-hidden="true"
      >
        001
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 md:px-12 pt-32 pb-24">
        <div className="max-w-[680px]">
          {/* Drop tag */}
          <div className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#004AAD] border border-[#004AAD] px-3 py-1 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD] animate-pulse" />
            Pour #001 — Opening Night
          </div>

          {/* Main headline */}
          <h1
            ref={headlineRef}
            className="font-display italic text-[52px] md:text-[72px] lg:text-[88px] leading-[0.95] text-[#141518] mb-6"
            style={{ perspective: "600px" }}
          >
            We&apos;re
            {" "}
            <span className="text-[#004AAD]">pouring</span>
            {" "}
            now.
          </h1>

          {/* Sub */}
          <p
            ref={subRef}
            className="font-sans text-base md:text-lg text-[#141518]/70 max-w-[440px] leading-relaxed mb-10"
          >
            Six pieces. One colourway. 200 of each.
            <br />
            When it&apos;s done, it&apos;s Tapped Out.
          </p>

          {/* CTAs */}
          <div ref={ctaRef} className="flex flex-wrap gap-4">
            <Link
              href="/pour/pour-001"
              className="font-mono text-xs uppercase tracking-widest bg-[#004AAD] text-[#E4E2DD] px-8 py-4 hover:bg-[#141518] transition-colors duration-200"
            >
              See the Pour
            </Link>
            <Link
              href="/last-call"
              className="font-mono text-xs uppercase tracking-widest border border-[#141518] text-[#141518] px-8 py-4 hover:bg-[#141518] hover:text-[#E4E2DD] transition-all duration-200"
            >
              Last Call
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#141518]/10" />
      <div className="absolute bottom-6 left-6 md:left-12 font-mono text-[10px] uppercase tracking-widest text-[#141518]/30">
        Drip Theka — Est. 2024
      </div>
    </section>
  );
}

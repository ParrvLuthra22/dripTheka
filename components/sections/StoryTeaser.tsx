"use client";

// Story Teaser — two-column editorial layout.
// Left: sticky eyebrow stack. Right: typewriter body copy.
// Each paragraph types out 60ms/char when it enters viewport.

import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal }  from "@/components/motion/Reveal";
import { TypeOnScroll, type Segment as TypeSegment } from "@/components/motion/TypeOnScroll";

// Manifesto paragraphs. Strings are typed char-by-char; node segments
// (the blue highlights) are revealed atomically.
const PARAGRAPHS: TypeSegment[][] = [
  [
    "We didn't start a clothing brand. We started a ",
    { node: <em className="not-italic text-[--blue]">theka</em>, chars: 5 },
    " — a corner where the dripped meet, where heritage and concrete shake hands, where every fit ",
    { node: <em className="not-italic text-[--blue]">means something.</em>, chars: 16 },
  ],
  [
    "Made in India, for the kids who code at midnight, ride at dawn, and dress like the city is theirs. ",
    { node: <em className="not-italic text-[--blue]">Because it is.</em>, chars: 14 },
  ],
  [
    "Six pieces. One colourway. Two hundred of each. When it's gone it's ",
    { node: <em className="not-italic text-[--blue]">Tapped Out</em>, chars: 10 },
    " — no restocks, no waiting lists. You either got it or you didn't. That's not scarcity marketing; that's respect for your time.",
  ],
];

export function StoryTeaser() {
  return (
    <section
      data-nav-tone="dark"
      className="bg-[--cream] py-20 md:py-32"
      aria-labelledby="story-heading"
    >
      <div style={{ paddingInline: "var(--pad-x)" }}>
        {/* Top eyebrow */}
        <Reveal className="flex justify-end mb-12">
          <Eyebrow color="ink">[03 / The Story]</Eyebrow>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 md:gap-20">

          {/* LEFT — sticky label stack */}
          <div className="md:sticky md:top-[calc(var(--header-h)+2rem)] self-start">
            <div className="flex flex-col gap-5">
              <Reveal delay={50}>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/30">
                  About Us
                </p>
              </Reveal>
              <Reveal delay={100}>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[--ink]/20">
                  01 / Our Why
                </p>
              </Reveal>

              <div className="hidden md:block w-px h-20 bg-[--ink]/10 mt-2" />

              <Reveal delay={150} className="hidden md:block">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/15 leading-relaxed max-w-[160px]">
                  Est. MMXXVI<br />New Delhi
                </p>
              </Reveal>
            </div>
          </div>

          {/* RIGHT — typewriter body */}
          <div className="space-y-10 md:space-y-12">
            {PARAGRAPHS.map((segments, i) => (
              <TypeOnScroll
                key={i}
                segments={segments}
                speed={60}
                threshold={0.25}
                as="p"
                className="font-display text-[--ink] leading-[1.15]"
                style={{ fontSize: "clamp(1.4rem, 3vw, 2.4rem)" }}
              />
            ))}

            {/* CTA */}
            <Reveal delay={280}>
              <Link
                href="/story"
                data-hover
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[--blue] hover:text-[--ink] transition-colors duration-200 mt-4"
              >
                Read the full story&nbsp;→
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

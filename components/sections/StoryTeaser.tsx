"use client";

// Story Teaser — two-column editorial layout.
// Left: sticky eyebrow stack. Right: Fraunces body with blue highlighted phrases.

import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Reveal } from "@/components/motion/Reveal";

// Manifesto paragraphs with rich-text markup hints.
// Phrases wrapped in <em> become blue italic.
const PARAGRAPHS = [
  [
    "We didn't start a clothing brand. We started a ",
    { em: "theka" },
    " — a corner where the dripped meet, where heritage and concrete shake hands, where every fit ",
    { em: "means something." },
  ],
  [
    "Made in India, for the kids who code at midnight, ride at dawn, and dress like the city is theirs. ",
    { em: "Because it is." },
  ],
  [
    "Six pieces. One colourway. Two hundred of each. When it's gone it's ",
    { em: "Tapped Out" },
    " — no restocks, no waiting lists. You either got it or you didn't. That's not scarcity marketing; that's respect for your time.",
  ],
] as const;

type Segment = string | { em: string };

function RichText({ segments }: { segments: readonly Segment[] }) {
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === "string" ? (
          <span key={i}>{seg}</span>
        ) : (
          <em key={i} className="not-italic font-display italic text-[--blue]">
            {seg.em}
          </em>
        )
      )}
    </>
  );
}

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

              {/* Thin vertical rule */}
              <div className="hidden md:block w-px h-20 bg-[--ink]/10 mt-2" />

              <Reveal delay={150} className="hidden md:block">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[--ink]/15 leading-relaxed max-w-[160px]">
                  Est. MMXXVI<br />New Delhi
                </p>
              </Reveal>
            </div>
          </div>

          {/* RIGHT — body copy */}
          <div className="space-y-8 md:space-y-10">
            {PARAGRAPHS.map((para, i) => (
              <Reveal key={i} delay={i * 80}>
                <p
                  className="font-display text-[--ink] leading-[1.2]"
                  style={{ fontSize: "clamp(1.25rem, 2.5vw, 2rem)" }}
                >
                  <RichText segments={para} />
                </p>
              </Reveal>
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

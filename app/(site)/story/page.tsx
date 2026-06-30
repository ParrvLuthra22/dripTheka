"use client";

// Story — long-form editorial. Each section has a distinct layout.
// No images — typographic anchors only.

import type { Metadata } from "next";
import Link from "next/link";
import { ThekaLabel }    from "@/components/ui/ThekaLabel";
import { Reveal }        from "@/components/motion/Reveal";
import { SplitReveal }   from "@/components/motion/SplitReveal";
import { Grain }         from "@/components/ui/Grain";
import { Sticker }       from "@/components/ui/Sticker";

export default function StoryPage() {
  return (
    <article data-nav-tone="dark" className="bg-[--cream] text-[--ink]">

      {/* ═══════════════════════════════════════════ HERO ══════ */}
      <header
        className="relative min-h-[70vh] flex flex-col justify-center"
        style={{ paddingInline: "var(--pad-x)", paddingBlock: "clamp(4rem, 8vw, 8rem)" }}
      >
        <Grain opacity={0.05} />
        <Sticker variant="wine-glass" rotate={-8} size={72}
          className="absolute right-[4vw] top-[35%] max-md:hidden z-10" />
        <Reveal className="mb-6">
          <ThekaLabel k="theStory" />
        </Reveal>

        <SplitReveal
          as="h1"
          splitBy="words"
          stagger={0.04}
          from={48}
          start="top 95%"
          className="font-tanker uppercase text-[--ink] leading-[0.85]"
        >
          WHY WE BUILT A THEKA.
        </SplitReveal>

        <Reveal delay={300} className="mt-8 max-w-[520px]">
          <p className="font-display italic text-[--ink]/55 leading-snug" style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.8rem)" }}>
            A corner where the dripped meet. No drinks. No dance floor. Just fits that mean something.
          </p>
        </Reveal>
      </header>

      {/* ════════════════ SECTION 1 — THE SPARK (centred narrow) ════ */}
      <section className="py-20 md:py-32 border-t border-[--ink]/8">
        <div className="max-w-[680px] mx-auto" style={{ paddingInline: "var(--pad-x)" }}>

          <Reveal>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[--ink]/30 mb-10">
              The Spark
            </p>
          </Reveal>

          <SplitReveal
            as="h2"
            splitBy="words"
            stagger={0.04}
            className="font-display italic text-[--ink] leading-tight mb-10"
          >
            Two friends. Too many texts about fits they couldn&apos;t find.
          </SplitReveal>

          {[
            "The brand started with a voice note. Ayaan sent it on a Tuesday afternoon: \"Bhai, there's no Indian brand that just gets it. Everything's either trying too hard or not hard enough.\"",
            "He was right. Indian streetwear had two modes: aspirational-but-derivative (copy Western brands, slap an Indian word on it), or hyper-local-but-inaccessible (heritage pieces that cost more than most people's rent).",
            "Neither of us wanted to make either of those brands. We wanted to make something that lived in the same city we did. That understood the specific energy of a Delhi kid who codes at midnight, rides at dawn, and dresses like the city is theirs.",
            "Because it is.",
          ].map((para, i) => (
            <Reveal key={i} delay={i * 60}>
              <p className="font-display italic text-[--ink]/70 leading-snug mb-6" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>
                {para}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Decorative typographic anchor */}
      <div className="flex justify-center py-16 select-none" aria-hidden="true">
        <span
          className="font-display italic text-[--ink]/10"
          style={{ fontSize: "clamp(6rem, 14vw, 14rem)", lineHeight: 0.85 }}
        >
          ✺
        </span>
      </div>

      {/* ══════════════ SECTION 2 — THE NAME (sticky label layout) ═══ */}
      <section className="py-20 md:py-32 border-t border-[--ink]/8">
        <div
          className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-12 md:gap-20"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* Sticky label */}
          <div className="md:sticky md:top-[calc(var(--header-h)+3rem)] self-start">
            <Reveal>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[--ink]/30">
                The Name
              </p>
            </Reveal>
          </div>

          {/* Body */}
          <div>
            <SplitReveal
              as="h2"
              splitBy="words"
              stagger={0.04}
              className="font-display italic text-[--ink] leading-tight mb-10"
            >
              Theka. A word that carries weight.
            </SplitReveal>

            {[
              "Theka literally means \"a licensed shop for the sale of alcohol\". In practice, it means something more. In Delhi, a theka is a social institution — the corner where accountabilities dissolve. Where the mechanic and the software engineer share a bench. Where hierarchies flatten.",
              "The theka is democratic in a way that most spaces aren't. You're defined by what you're wearing, not what you do. You're defined by your presence, not your portfolio.",
              "We took that word and gave it a different context. A fashion theka. A place where you come for the fits, stay for the feeling. The wine glass — an aspirational vessel at a neighbourhood joint — is the visual punchline of this joke.",
              "The name does something specific: it grounds the brand in place. This is not a brand from nowhere. This is a brand from here. From the specific, humid, loud, beautiful mess of this city.",
            ].map((para, i) => (
              <Reveal key={i} delay={i * 70}>
                <p className="font-display italic text-[--ink]/70 leading-snug mb-8" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FULL-WIDTH PULL QUOTE ═══════════════ */}
      <section className="bg-[--ink] py-24 md:py-36" style={{ paddingInline: "var(--pad-x)" }}>
        <SplitReveal
          as="blockquote"
          splitBy="words"
          stagger={0.035}
          from={40}
          className="font-display italic text-[--cream] leading-tight max-w-[860px]"
        >
          &ldquo;We&rsquo;re not a brand. We&rsquo;re a theka. There&rsquo;s a difference.&rdquo;
        </SplitReveal>
      </section>

      {/* ══════════════ SECTION 3 — THE FIRST SAMPLE (full-width) ═══ */}
      <section className="py-20 md:py-32 border-t border-[--ink]/8">
        <div style={{ paddingInline: "var(--pad-x)" }}>
          <Reveal className="mb-10">
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[--blue]">
              Dec 2025
            </span>
          </Reveal>

          <SplitReveal
            as="h2"
            splitBy="words"
            stagger={0.04}
            className="font-display italic text-[--ink] leading-tight mb-12"
          >
            The first sample arrived. It was wrong. That&apos;s when it became real.
          </SplitReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 max-w-[1000px]">
            {[
              "The courier arrived at 11am. The box was smaller than expected. We pulled out the tee. The hand-feel was off. Not bad — just not right. Thirty GSM lighter than specced. The colour shifted under Delhi's afternoon light.",
              "We sent it back the same afternoon. That refusal — that clarity about what we didn't want — was the moment Drip Theka became real. Not because we had a product. But because we had a standard.",
            ].map((para, i) => (
              <Reveal key={i} delay={i * 80}>
                <p className="font-display italic text-[--ink]/65 leading-snug" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SECTION 4 — POUR #001 (offset-right) ═══════ */}
      <section className="py-20 md:py-32 border-t border-[--ink]/8">
        <div
          className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-10"
          style={{ paddingInline: "var(--pad-x)" }}
        >
          {/* Left: decorative glass */}
          <div className="flex flex-col items-start gap-6">
            <Reveal>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[--ink]/30">
                Pour #001
              </p>
            </Reveal>
            <div className="select-none" aria-hidden="true">
              <span
                className="font-display italic text-[--blue]/15 block"
                style={{ fontSize: "clamp(8rem, 18vw, 18rem)", lineHeight: 0.85 }}
              >
                001
              </span>
            </div>
          </div>

          {/* Right: body */}
          <div>
            <SplitReveal
              as="h2"
              splitBy="words"
              stagger={0.04}
              className="font-display italic text-[--ink] leading-tight mb-10"
            >
              Six pieces. One colourway. 200 of each.
            </SplitReveal>

            {[
              "The first round is not a test. It's a statement. Cobalt, cream, ink — three colours that say exactly what we mean. No confusion, no gradients, no trying to be everything to everyone.",
              "We made 200 of each because that's the right number. Enough to reach people, few enough that when you wear it in public and someone stops you, it means something. That moment of recognition is what we're actually selling.",
              "When it's done, it's Tapped Out. No restocks. We don't refill because the scarcity is the point. Every pour is finite.",
            ].map((para, i) => (
              <Reveal key={i} delay={i * 70}>
                <p className="font-display italic text-[--ink]/65 leading-snug mb-7" style={{ fontSize: "clamp(1rem, 1.8vw, 1.3rem)" }}>
                  {para}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ BOTTOM CTA ═════════ */}
      <section className="py-20 border-t border-[--ink]/8 text-center" style={{ paddingInline: "var(--pad-x)" }}>
        <Reveal className="space-y-6">
          <p className="font-display italic text-[--ink]/50" style={{ fontSize: "clamp(1.2rem, 2.5vw, 2rem)" }}>
            That&apos;s the story so far.
          </p>
          <Link
            href="/regulars"
            data-hover
            className="inline-block font-mono text-[10px] uppercase tracking-[0.16em] border border-[--ink] text-[--ink] px-8 py-4 hover:bg-[--ink] hover:text-[--cream] transition-all duration-200"
          >
            Pull up a stool → Join the Regulars
          </Link>
        </Reveal>
      </section>
    </article>
  );
}

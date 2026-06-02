// Home placeholder — V1 shell verification page.
// Shows all three fonts, design tokens, and key UI components.
// Will be replaced by the full hero + collection page in a later build step.

import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/motion/Reveal";
import { SplitReveal } from "@/components/motion/SplitReveal";

export default function HomePage() {
  return (
    <div className="bg-[--cream] text-[--ink]">
      {/* ── Font showcase ──────────────────────────────────────────────── */}
      <section className="container-site py-32 space-y-16">
        <Eyebrow>Shell verification · Pour #001 incoming</Eyebrow>

        {/* Fraunces — display italic */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[--ink]/30">
            Display — Fraunces (variable italic)
          </p>
          <h1 className="type-display-xl text-[--ink]">
            We&apos;re <span className="text-[--blue]">pouring</span> now.
          </h1>
          <p className="type-display-md text-[--ink]/50">
            Six pieces. One colourway. 200 of each.
          </p>
        </div>

        {/* Geist Sans — body */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[--ink]/30">
            Sans — Geist (body / UI)
          </p>
          <p className="type-body-lg max-w-[560px]">
            Drip Theka is a clothing brand. The actual product is belonging. We
            make small runs of quality pieces for people who know what they want
            and don&apos;t need to be sold to.
          </p>
          <p className="type-body-sm text-[--ink]/50 max-w-[420px]">
            When it&apos;s done, it&apos;s Tapped Out. No restocks. No waiting
            lists. You either got it or you didn&apos;t. That&apos;s the whole
            idea.
          </p>
        </div>

        {/* JetBrains Mono — tags / prices */}
        <div className="space-y-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[--ink]/30">
            Mono — JetBrains Mono (tags, prices, labels)
          </p>
          <div className="flex flex-wrap gap-4 items-baseline">
            <span className="font-mono text-xl text-[--ink]">₹2,499</span>
            <span className="font-mono text-xs text-[--blue] uppercase tracking-widest">
              Pour #001
            </span>
            <span className="font-mono text-xs text-[--ink]/40 uppercase tracking-widest border border-[--ink]/20 px-3 py-1">
              Tapped Out
            </span>
            <span className="font-mono text-xs text-[--cream] bg-[--blue] uppercase tracking-widest px-3 py-1">
              Opening Night
            </span>
          </div>
        </div>

        {/* ── Colour swatches ──────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[--ink]/30">
            Brand palette
          </p>
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "#004AAD", bg: "bg-[--blue]", text: "text-[--cream]" },
              { label: "#002F70", bg: "bg-[--blue-deep]", text: "text-[--cream]" },
              { label: "#E4E2DD", bg: "bg-[--cream] border border-[--ink]/10", text: "text-[--ink]" },
              { label: "#141518", bg: "bg-[--ink]", text: "text-[--cream]" },
              { label: "#2A2B2F", bg: "bg-[--ink-soft]", text: "text-[--cream]" },
            ].map(({ label, bg, text }) => (
              <div
                key={label}
                className={`flex items-center justify-center w-24 h-24 ${bg} ${text}`}
              >
                <span className="font-mono text-[9px] text-center leading-snug px-1">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Marquee strip (UI component test) ────────────────────────── */}
      <div className="bg-[--blue] py-4">
        <Marquee speed={24} gap="16">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="font-mono text-[10px] uppercase tracking-[0.14em] text-[--cream] shrink-0">
              Pour #001 — The First Round &nbsp;·&nbsp; 30% Deposit &nbsp;·&nbsp; 200 Units &nbsp;·&nbsp; Opening Night
            </span>
          ))}
        </Marquee>
      </div>

      {/* ── Motion + Button tests ─────────────────────────────────────── */}
      <section className="bg-[--ink] py-32">
        <div className="container-site space-y-12">
          <Eyebrow color="cream">Motion system verification</Eyebrow>

          {/* SplitReveal */}
          <SplitReveal
            className="type-display-lg text-[--cream] max-w-[700px]"
            splitBy="words"
            as="h2"
          >
            Scroll reveals smooth on inertia scroll.
          </SplitReveal>

          {/* Reveal */}
          <Reveal delay={100} className="max-w-[480px]">
            <p className="type-body-lg text-[--cream]/60">
              Lenis + GSAP ScrollTrigger are active. This block fades and rises
              as it enters the viewport. Reduced-motion users see it
              instantly.
            </p>
          </Reveal>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button variant="solid" magnetic>
              Add to Glass
            </Button>
            <Button variant="outline" className="border-[--cream] text-[--cream] hover:bg-[--cream] hover:text-[--ink]" magnetic>
              See the Pour
            </Button>
            <Button variant="ghost" className="text-[--cream]/60 hover:text-[--cream]">
              Learn more
            </Button>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[--cream]/20">
            Hover the solid + outline buttons on desktop — magnetic GSAP translate active
          </p>
        </div>
      </section>

      {/* ── Eyebrow + design tokens table ────────────────────────────── */}
      <section className="container-site py-24 space-y-8">
        <Eyebrow>Design tokens</Eyebrow>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
          {[
            ["--blue",        "#004AAD"],
            ["--blue-deep",   "#002F70"],
            ["--cream",       "#E4E2DD"],
            ["--cream-warm",  "#EFEAD8"],
            ["--ink",         "#141518"],
            ["--ink-soft",    "#2A2B2F"],
            ["--container",   "1440px"],
            ["--pad-x",       "clamp(20px, 4vw, 72px)"],
            ["--header-h",    "84px"],
            ["--ease-pour",   "cubic-bezier(.6,.05,.2,1)"],
            ["--ease-out-expo","cubic-bezier(.16,1,.3,1)"],
          ].map(([token, value]) => (
            <div key={token} className="border border-[--ink]/10 p-3">
              <p className="text-[--blue] text-[10px]">{token}</p>
              <p className="text-[--ink]/50 text-[10px] mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

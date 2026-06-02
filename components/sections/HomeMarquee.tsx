// HomeMarquee — cream background, ink type, hairline borders top and bottom.
// Pure CSS infinite scroll — no JS required.

import { WineGlassMark } from "@/components/glass/WineGlassMark";

const PHRASES = [
  "Serving Fits Not Drinks",
  "Pour #001",
  "Opening Night Soon",
  "Made in Delhi",
  "Drip Theka",
];

function MarqueeItem() {
  return (
    <>
      {PHRASES.map((phrase, i) => (
        <span key={i} className="inline-flex items-center gap-4 shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[--ink] whitespace-nowrap">
            {phrase}
          </span>
          <WineGlassMark
            size={14}
            className="text-[--ink] opacity-40 shrink-0"
          />
        </span>
      ))}
    </>
  );
}

export function HomeMarquee() {
  return (
    <div className="relative border-y border-[--ink]/10 bg-[--cream] overflow-hidden py-3.5">
      {/* Two identical tracks side by side — seamless infinite loop */}
      <div
        className="flex gap-8 w-max"
        style={{
          animation: "marquee-scroll 28s linear infinite",
          willChange: "transform",
        }}
      >
        {/* Track 1 */}
        <span className="flex items-center gap-8">
          <MarqueeItem />
        </span>
        {/* Track 2 — duplicate for seamless wrap */}
        <span className="flex items-center gap-8" aria-hidden="true">
          <MarqueeItem />
        </span>
      </div>
    </div>
  );
}

// HomeMarquee — bold tilted ribbon, infinite scroll.
// Pure CSS animation — no JS required.

const PHRASES = [
  "DRIP THEKA",
  "SERVING FITS NOT DRINKS",
  "LIMITED STOCK",
  "MAXING OUT",
  "POUR #001 OUT SOON",
];

// Asterisk separator — typographic instead of a decorative glass icon
function Separator() {
  return (
    <span
      aria-hidden="true"
      className="font-loud text-(--cream) text-3xl md:text-5xl shrink-0 mx-4 select-none uppercase"
      style={{ transform: "translateY(-0.1em)" }}
    >
      ✺
    </span>
  );
}

function MarqueeItem() {
  return (
    <>
      {PHRASES.map((phrase, i) => (
        <span key={i} className="inline-flex items-center gap-4 shrink-0">
          <span className="font-loud text-(--cream) text-3xl md:text-5xl whitespace-nowrap uppercase leading-none tracking-tight">
            {phrase}
          </span>
          <Separator />
        </span>
      ))}
    </>
  );
}

export function HomeMarquee() {
  return (
    <div className="relative border-y-4 border-(--ink) bg-(--blue) overflow-hidden py-4 md:py-6 rotate-[-1deg] scale-[1.02] z-20 shadow-2xl">
      {/* Two identical tracks side by side — seamless infinite loop */}
      <div
        className="flex gap-4 w-max"
        style={{
          animation: "marquee-scroll 15s linear infinite",
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

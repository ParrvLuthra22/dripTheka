// CircledEyebrow — shared section eyebrow with a hand-drawn blue circle.
//
// The circle is the recurring "blue line" that kept cutting through eyebrow
// text (Currently Pouring, Bartender's Pick, …). Root cause: the ChalkMark was
// absolutely positioned at `inset-0`, i.e. exactly the text box, so the wobbly
// stroke — stretched with preserveAspectRatio="none" — crossed the glyphs
// whenever the label was long.
//
// Fix, centralized here so no section can reintroduce it: the circle rings the
// label from OUTSIDE via a negative inset. It always sits clear of every glyph
// (English label AND Hinglish gloss) at any width, and because it overflows
// outward it never changes the eyebrow's layout box or crowds the heading below.

import { ThekaLabel, type ThekaKey } from "@/components/ui/ThekaLabel";
import { ChalkMark } from "@/components/ui/ChalkMark";
import { cn } from "@/lib/utils/cn";

interface CircledEyebrowProps {
  k: ThekaKey;
  color?: "blue" | "ink" | "cream";
  /** Show the Hinglish gloss — forwarded to ThekaLabel. Default true. */
  showHi?: boolean;
  /** Extra classes on the wrapper (e.g. margin-bottom to the heading). */
  className?: string;
}

export function CircledEyebrow({
  k,
  color = "ink",
  showHi = true,
  className,
}: CircledEyebrowProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      <ThekaLabel k={k} color={color} showHi={showHi} />
      {/* Wrapper is inset OUTSIDE the text box via inline offsets (all four sides
          set → it grows past the label); the ChalkMark fills it. The circle
          therefore rings the label and never crosses a glyph, at any width. */}
      <span
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{ left: -22, right: -22, top: -13, bottom: -13 }}
      >
        <ChalkMark variant="circle" color="var(--blue)" className="w-full h-full" />
      </span>
    </span>
  );
}

// ThekaLabel — bilingual Theka Language label component.
//
// Renders a proper-noun label with an optional Hinglish italic gloss.
// Convention: PRIMARY LABEL <dim dot gloss>
// Example:    "Currently Pouring  · abhi nikla hai"
//
// Roman Hindi only — no Devanagari (that's ScrambleText's domain).
// Lowercase italic for the gloss so it reads as casual, not corporate.
//
// Usage:
//   <ThekaLabel k="currentlyPouring" />
//   → [hairline] Currently Pouring  · abhi nikla hai
//
//   <ThekaLabel k="freshlyPoured" as="span" showHi={false} hairline={false} />
//   → Freshly Poured            (tag pill use-case)

import React from "react";
import { cn }         from "@/lib/utils/cn";
import { copy }       from "@/data/copy";

// ── Types ─────────────────────────────────────────────────────────────────

export type ThekaKey = keyof typeof copy.language;

interface ThekaLabelProps {
  /** Key into copy.language — determines which bilingual pair is shown */
  k:          ThekaKey;
  /** Show the Hinglish gloss — default true. Set false for tight spaces. */
  showHi?:    boolean;
  /** Show the vertical hairline (Eyebrow-style) — default true */
  hairline?:  boolean;
  /** Text colour context */
  color?:     "blue" | "ink" | "cream";
  /** Wrapping element — default "p" */
  as?:        keyof React.JSX.IntrinsicElements;
  className?: string;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const colorMap = {
  blue:  "text-(--blue)",
  ink:   "text-(--ink)/50",
  cream: "text-(--cream)/60",
} as const;

// ── Component ──────────────────────────────────────────────────────────────

export function ThekaLabel({
  k,
  showHi   = true,
  hairline = true,
  color    = "blue",
  as:  Tag = "p",
  className,
}: ThekaLabelProps) {
  const entry = copy.language[k];

  return React.createElement(
    Tag as string,
    {
      className: cn(
        "inline-flex items-center gap-2",
        "font-mono text-[10px] uppercase tracking-[0.14em]",
        colorMap[color],
        className
      ),
    },
    // Leading hairline — same as Eyebrow's visual treatment
    hairline && React.createElement("span", {
      "aria-hidden": "true",
      className:     "block w-px h-5 bg-current opacity-40 shrink-0",
    }),
    // English label (primary, always visible)
    React.createElement("span", {}, entry.en),
    // Hinglish gloss — italic, dimmed, normal case
    showHi && React.createElement("span", {
      "aria-hidden": "true",
      className:     "lowercase italic opacity-50 tracking-normal not-uppercase",
      style:         { textTransform: "none" as const },
    }, `· ${entry.hi}`)
  );
}

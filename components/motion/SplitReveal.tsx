"use client";

// Manual word/char split reveal using GSAP.
// Splits children text into <span class="split-char"> elements server-side,
// then animates them on scroll via GSAP ScrollTrigger.
// No GSAP SplitText plugin required (manual split).

import React, { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(ScrollTrigger);

interface SplitRevealProps {
  children: ReactNode;
  className?: string;
  /** "words" | "chars" — default "words" */
  splitBy?: "words" | "chars";
  /** stagger delay between each unit in seconds */
  stagger?: number;
  /** y offset to animate from */
  from?: number;
  /** Start trigger — default "top 85%" */
  start?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function SplitReveal({
  children,
  className,
  splitBy = "words",
  stagger = 0.04,
  from = 40,
  start = "top 85%",
  as: Tag = "p",
}: SplitRevealProps) {
  const containerRef = useRef<HTMLElement>(null);
  const splitRef = useRef<HTMLElement | null>(null);

  // We render as a hidden block server-side and split on the client.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Extract plain text from current children
    const rawText = container.textContent ?? "";
    if (!rawText.trim()) return;

    // Build split spans
    let units: string[];
    if (splitBy === "chars") {
      units = rawText.split("");
    } else {
      units = rawText.split(/(\s+)/); // preserve spaces
    }

    container.innerHTML = units
      .map((unit) =>
        unit.trim()
          ? `<span class="split-char" style="display:inline-block;overflow:hidden"><span class="split-inner" style="display:inline-block">${unit}</span></span>`
          : unit
      )
      .join("");

    const inners = container.querySelectorAll<HTMLElement>(".split-inner");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inners,
        { y: from, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: container,
            start,
            once: true,
          },
        }
      );
    }, container);

    splitRef.current = container;

    return () => ctx.revert();
  }, [splitBy, stagger, from, start]);

  return React.createElement(
    Tag,
    { ref: containerRef, className: cn(className) },
    children
  );
}

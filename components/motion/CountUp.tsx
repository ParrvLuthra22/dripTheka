"use client";

// CountUp — animates a number from prevValue → newValue over `duration`.
// Uses rAF + easeOutCubic. Reacts to value changes (e.g. reservation polls).

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  /** Target number to count to */
  value:      number;
  /** Duration of the animation in ms (default 800) */
  duration?:  number;
  /** Decimal places to render (default 0) */
  decimals?:  number;
  /** Format the displayed number — overrides decimals */
  format?:    (n: number) => string;
  /** Render as className */
  className?: string;
  /** prefix/suffix text */
  prefix?:    string;
  suffix?:    string;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CountUp({
  value,
  duration = 800,
  decimals = 0,
  format,
  className,
  prefix = "",
  suffix = "",
}: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const prev      = useRef(value);
  const startTime = useRef<number | null>(null);
  const rafId     = useRef(0);

  useEffect(() => {
    const from = prev.current;
    const to   = value;
    // Equal value, or reduced motion → snap to the final value next frame.
    if (from === to ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prev.current = to;
      rafId.current = requestAnimationFrame(() => setDisplay(to));
      return () => cancelAnimationFrame(rafId.current);
    }

    startTime.current = null;

    const tick = (now: number) => {
      if (startTime.current === null) startTime.current = now;
      const t = Math.min(1, (now - startTime.current) / duration);
      const eased = easeOutCubic(t);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        prev.current = to;
      }
    };

    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [value, duration]);

  const formatted = format
    ? format(display)
    : decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString("en-IN");

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

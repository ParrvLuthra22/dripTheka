"use client";

// ScrambleText — kinetic text that cycles through a character pool
// before settling on the target string.
//
// Each character independently resolves at a staggered time, creating
// a wave effect across the word. Mixed Devanagari + Latin for the
// Drip Theka aesthetic.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

// Pool of characters to cycle through during scramble.
// Mix of Latin uppercase + Devanagari consonants/vowels for brand-specific vibe.
const POOL =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "अआइईउऊएऐओकखगघचछजझञटठडढतथदधनपफबभमयरलवशषसह" +
  "0123456789";

interface ScrambleTextProps {
  /** The final text to resolve to */
  text: string;
  /** Total duration of the scramble in ms */
  duration?: number;
  /** Per-char stagger delay in ms */
  stagger?: number;
  /** Scramble speed: ms between each random character change */
  speed?: number;
  /** className applied to the wrapper element */
  className?: string;
  /** Inline style applied to the wrapper */
  style?: React.CSSProperties;
  /** Called when all chars have resolved */
  onComplete?: () => void;
  /** Auto-start on mount (default true) */
  autoStart?: boolean;
}

function randomChar(): string {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

export function ScrambleText({
  text,
  duration = 1200,
  stagger  = 50,
  speed    = 40,
  className,
  style,
  onComplete,
  autoStart = true,
}: ScrambleTextProps) {
  const [display, setDisplay] = useState<string>("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (!autoStart || startedRef.current) return;
    startedRef.current = true;

    const targetChars = Array.from(text);
    // Each char gets its own resolve time (staggered across duration)
    // Char `i` should resolve at: `i * stagger + (duration - lastStagger)`
    const lastStagger = (targetChars.length - 1) * stagger;
    const resolveDuration = Math.max(duration - lastStagger, 300);
    const resolveTimes = targetChars.map(
      (_, i) => i * stagger + resolveDuration
    );

    const start = performance.now();
    let interval: number | null = null;

    const updateChars = (now: number) => {
      const elapsed = now - start;
      const result = targetChars.map((target, i) => {
        if (elapsed >= resolveTimes[i]) return target;
        // Preserve spaces / non-letter chars (don't scramble them)
        if (!/[A-Za-zऀ-ॿ0-9]/.test(target)) return target;
        return randomChar();
      });
      setDisplay(result.join(""));
      if (elapsed >= resolveTimes[targetChars.length - 1]) {
        if (interval !== null) {
          window.clearInterval(interval);
          interval = null;
        }
        onComplete?.();
      }
    };

    // First tick
    updateChars(performance.now());

    interval = window.setInterval(() => {
      updateChars(performance.now());
    }, speed);

    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span
      aria-label={text}
      className={cn("inline-block", className)}
      style={style}
    >
      {display}
    </span>
  );
}

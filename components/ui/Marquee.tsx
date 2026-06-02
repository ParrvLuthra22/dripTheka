// Pure CSS infinite marquee — no JS required.
// Renders two copies of content so the seam is invisible.

import { cn } from "@/lib/utils/cn";
import type { CSSProperties } from "react";

interface MarqueeProps {
  children: React.ReactNode;
  /** Duration of one full cycle in seconds (default 28) */
  speed?: number;
  /** Pause on hover */
  pauseOnHover?: boolean;
  /** Scroll direction */
  direction?: "left" | "right";
  className?: string;
  itemClassName?: string;
  /** Gap between items — Tailwind arbitrary value e.g. "8" = 2rem */
  gap?: string;
}

export function Marquee({
  children,
  speed = 28,
  pauseOnHover = false,
  direction = "left",
  className,
  itemClassName,
  gap = "12",
}: MarqueeProps) {
  const style: CSSProperties = {
    "--marquee-duration": `${speed}s`,
    "--marquee-direction": direction === "right" ? "reverse" : "normal",
  } as CSSProperties;

  return (
    <div
      className={cn("overflow-hidden", className)}
      aria-hidden="true" // decorative — screen readers skip
    >
      <div
        className={cn(
          `flex gap-${gap}`,
          pauseOnHover && "hover:[animation-play-state:paused] *:[animation-play-state:inherit]"
        )}
        style={style}
      >
        {/* Track 1 */}
        <div
          className={cn("marquee-track shrink-0", itemClassName)}
          style={{
            gap: `var(--spacing-${gap}, 3rem)`,
            animationDuration: "var(--marquee-duration, 28s)",
            animationDirection: "var(--marquee-direction, normal)",
          }}
        >
          {children}
        </div>
        {/* Track 2 — aria-hidden duplicate for seamless loop */}
        <div
          aria-hidden="true"
          className={cn("marquee-track shrink-0", itemClassName)}
          style={{
            gap: `var(--spacing-${gap}, 3rem)`,
            animationDuration: "var(--marquee-duration, 28s)",
            animationDirection: "var(--marquee-direction, normal)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

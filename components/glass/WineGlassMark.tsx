// STUB — Wine glass brand mark placeholder
// The actual Three.js/SVG glass is built in the glasses prompt.
// This renders a minimal SVG stand-in so layouts don't break.

import { cn } from "@/lib/utils/cn";

interface WineGlassMarkProps {
  className?: string;
  size?: number;
  color?: string;
}

export function WineGlassMark({
  className,
  size = 32,
  color = "currentColor",
}: WineGlassMarkProps) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 32 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden="true"
    >
      <path
        d="M4 4 Q4 28 16 36 Q28 28 28 4 Z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="round"
      />
      <line x1="16" y1="36" x2="16" y2="44" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="46" x2="24" y2="46" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

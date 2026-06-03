// TappedOutStamp — typographic stamp replacing the tilted wine glass watermark.
//
// Stamp-style overlay: rotated -8°, distressed border, mono uppercase.
// Used on product cards that are fully sold out.

import { cn } from "@/lib/utils/cn";

interface TappedOutStampProps {
  className?: string;
}

export function TappedOutStamp({ className }: TappedOutStampProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex items-center justify-center pointer-events-none",
        className
      )}
      aria-hidden="true"
    >
      <div
        className="border-[3px] border-[#FF7070] px-4 py-2 flex flex-col items-center justify-center gap-0.5"
        style={{
          transform: "rotate(-8deg)",
          // Distressed border — subtle outer glow + inner shadow
          boxShadow: "inset 0 0 8px rgba(255,112,112,0.18), 0 0 24px rgba(255,112,112,0.12)",
        }}
      >
        <span
          className="font-mono uppercase tracking-[0.2em] text-[#FF7070]"
          style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.95rem)", lineHeight: 1 }}
        >
          ✗ Tapped
        </span>
        <span
          className="font-mono uppercase tracking-[0.2em] text-[#FF7070]"
          style={{ fontSize: "clamp(0.7rem, 1.2vw, 0.95rem)", lineHeight: 1 }}
        >
          Out
        </span>
        <span
          className="font-mono uppercase tracking-[0.16em] text-[#FF7070]/55 mt-0.5"
          style={{ fontSize: "9px", lineHeight: 1 }}
        >
          DROP COMPLETE
        </span>
      </div>
    </div>
  );
}

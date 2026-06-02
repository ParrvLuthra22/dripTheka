"use client";

import { useSound } from "./SoundProvider";
import { cn } from "@/lib/utils/cn";

export function SoundToggle({ className }: { className?: string }) {
  const { muted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      aria-label={muted ? "Unmute" : "Mute"}
      aria-pressed={!muted}
      className={cn(
        "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest",
        "text-[--ink] hover:text-[--blue] transition-colors duration-200",
        className
      )}
    >
      {/* Waveform bars */}
      <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
        {[4, 10, 6, 12, 4].map((h, i) => (
          <span
            key={i}
            className="w-[2px] rounded-sm transition-all duration-300"
            style={{
              height: muted ? "3px" : `${h}px`,
              backgroundColor: "currentColor",
              opacity: muted ? 0.3 : 1,
              transitionDelay: `${i * 40}ms`,
            }}
          />
        ))}
      </span>
      <span>{muted ? "muted" : "live"}</span>
    </button>
  );
}

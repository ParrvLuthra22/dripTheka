"use client";

// SoundToggle — fixed bottom-left, mix-blend-mode difference.
// Manages the global ambient loop via Howler.
// State lives in /lib/store/sound.ts (Zustand + localStorage persist).

import { useEffect, useRef } from "react";
import { useSoundStore } from "@/lib/store/sound";

// Bar heights for animated waveform — vary per bar for visual interest
const BARS = [5, 10, 7, 14, 8, 11, 5] as const;
// Animation durations per bar (ms) so they feel organic, not in lockstep
const DURATIONS = [600, 480, 700, 520, 640, 500, 680] as const;
const DELAYS    = [  0,  80, 160,  40, 120, 200,  60] as const;

export function SoundToggle() {
  const { muted, toggle } = useSoundStore();
  const ambientRef = useRef<{
    play: () => number;
    stop: (id?: number) => void;
    playing: (id?: number) => boolean;
    unload: () => void;
  } | null>(null);
  const playId = useRef<number | undefined>(undefined);
  // Track whether we've ever unmuted (so ambient starts on first ON, not on SSR)
  const hasUnmutedRef = useRef(false);

  // Initialise Howler ambient once on mount
  useEffect(() => {
    let h: typeof ambientRef.current | null = null;
    import("howler").then(({ Howl }) => {
      h = new Howl({
        src:    ["/sounds/ambient.mp3"],
        loop:   true,
        volume: 0.08,
        html5:  true,
      });
      ambientRef.current = h;

      // Resume if sound was ON in a previous session
      if (!muted) {
        playId.current = h.play();
        hasUnmutedRef.current = true;
      }
    }).catch(() => {/* file may not exist in dev */});

    return () => { h?.stop(); h?.unload(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to muted state changes
  useEffect(() => {
    const amb = ambientRef.current;
    if (!amb) return;

    if (!muted) {
      hasUnmutedRef.current = true;
      if (!amb.playing(playId.current)) {
        playId.current = amb.play();
      }
    } else {
      amb.stop(playId.current);
    }
  }, [muted]);

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Enable sound" : "Mute sound"}
      aria-pressed={!muted}
      data-hover
      className={[
        // Fixed position — bottom-left, above the page footer
        "fixed bottom-7 left-6 z-[60]",
        "flex items-center gap-2",
        // mix-blend-mode: difference makes white text read on any background
        "text-white [mix-blend-mode:difference]",
        "font-mono text-[9px] uppercase tracking-[0.14em]",
        "cursor-pointer select-none",
        "transition-opacity duration-200 hover:opacity-70",
        // hide on very small screens so it doesn't crowd the UI
        "hidden sm:flex",
      ].join(" ")}
    >
      {/* Animated waveform */}
      <span
        className="flex items-end gap-[2px]"
        aria-hidden="true"
        style={{ height: 14 }}
      >
        {BARS.map((maxH, i) => (
          <span
            key={i}
            className="w-[2px] rounded-full bg-current"
            style={
              muted
                ? { height: 2, transition: `height ${DURATIONS[i]}ms ease` }
                : {
                    height: maxH,
                    animation: `waveform-bar ${DURATIONS[i]}ms ${DELAYS[i]}ms ease-in-out infinite alternate`,
                  }
            }
          />
        ))}
      </span>

      <span>sound&nbsp;·&nbsp;{muted ? "off" : "on"}</span>

      <style>{`
        @keyframes waveform-bar {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </button>
  );
}

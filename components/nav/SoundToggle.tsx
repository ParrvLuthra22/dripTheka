"use client";

import { useSoundStore } from "@/lib/store/sound";

export function SoundToggle() {
  const { muted, toggle } = useSoundStore();

  return (
    <button
      onClick={toggle}
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#141518] hover:text-[#004AAD] transition-colors duration-200"
    >
      <span className="inline-flex gap-0.5 items-end h-3">
        <span
          className="w-0.5 rounded-full transition-all duration-300"
          style={{
            height: muted ? "4px" : "8px",
            backgroundColor: "currentColor",
            opacity: muted ? 0.4 : 1,
          }}
        />
        <span
          className="w-0.5 rounded-full transition-all duration-300"
          style={{
            height: muted ? "4px" : "12px",
            backgroundColor: "currentColor",
            opacity: muted ? 0.4 : 1,
          }}
        />
        <span
          className="w-0.5 rounded-full transition-all duration-300"
          style={{
            height: muted ? "4px" : "6px",
            backgroundColor: "currentColor",
            opacity: muted ? 0.4 : 1,
          }}
        />
      </span>
      <span>{muted ? "muted" : "live"}</span>
    </button>
  );
}

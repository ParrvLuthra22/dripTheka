"use client";

// Howler.js sound context — V1 shell stub.
// Actual sound files wired in /public/sounds in a later build step.

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useSoundStore } from "@/lib/store/sound";

type SoundName = "add" | "pour" | "tap" | "open" | "close";

interface SoundContextValue {
  play: (name: SoundName) => void;
  muted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  muted: true,
  toggleMute: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const { muted, toggle } = useSoundStore();

  const play = useCallback(
    (_name: SoundName) => {
      if (muted) return;
      // Howler playback wired in when sound files land in /public/sounds
      // import { Howl } from "howler";
    },
    [muted]
  );

  return (
    <SoundContext.Provider value={{ play, muted, toggleMute: toggle }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}

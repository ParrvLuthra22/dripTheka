"use client";

// SoundProvider — owns persistent Howl instances for the entire app.
//
// Why this is centralised: each `new Howl()` allocates an HTMLAudioElement
// (in html5 mode) or Web Audio buffer. Creating a fresh Howl on every
// "Add to Glass" / form submit exhausts the audio pool. Here we create
// ONE Howl per named sound, lazily, and reuse it on every play() call.
//
// `useSound().play("clink")` from any client component.

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSoundStore } from "@/lib/store/sound";

type SoundName = "pour" | "clink";

interface HowlInstance {
  play:   () => number;
  stop:   (id?: number) => void;
  unload: () => void;
}

interface SoundContextValue {
  play:       (name: SoundName) => void;
  muted:      boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  play:       () => {},
  muted:      true,
  toggleMute: () => {},
});

// Per-sound configuration. Add new entries here, not at the call site.
const SOUND_FILES: Record<SoundName, { src: string; volume: number }> = {
  pour:  { src: "/sounds/pour.mp3",  volume: 0.5  },
  clink: { src: "/sounds/clink.mp3", volume: 0.55 },
};

export function SoundProvider({ children }: { children: ReactNode }) {
  const { muted, toggle } = useSoundStore();

  // Persistent Howl instances — one per named sound, never recreated
  const howlsRef = useRef<Partial<Record<SoundName, HowlInstance>>>({});

  // Lazily import Howler and pre-create all instances on mount
  useEffect(() => {
    let cancelled = false;

    import("howler").then(({ Howl }) => {
      if (cancelled) return;
      (Object.keys(SOUND_FILES) as SoundName[]).forEach((name) => {
        if (howlsRef.current[name]) return;
        howlsRef.current[name] = new Howl({
          src:    [SOUND_FILES[name].src],
          volume: SOUND_FILES[name].volume,
          html5:  true,
          preload: true,
        }) as unknown as HowlInstance;
      });
    }).catch(() => {/* silent — sound files may not be available */});

    return () => {
      cancelled = true;
      // Unload all on unmount (rare — provider sits at root)
      const refs = howlsRef.current;
      (Object.keys(refs) as SoundName[]).forEach((name) => {
        refs[name]?.unload();
      });
      howlsRef.current = {};
    };
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      if (muted) return;
      const howl = howlsRef.current[name];
      // If a play is already in flight on the same Howl, Howler handles
      // re-triggering correctly (returns a new playId without allocating
      // a new instance). No pool exhaustion.
      howl?.play();
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

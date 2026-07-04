"use client";

// SoundProvider — single source of truth for all Howler instances.
//
// Design:
//   • Preloaded on mount: ambient, pour, clink (used often, need zero-latency)
//   • Lazy (first play): cap, shutter, print, wobble
//   • Ambient: managed here (not in SoundToggle). Fade-in 3s / fade-out 1.5s.
//     Only starts after the user has explicitly interacted with the sound toggle.
//   • play() applies volumeMaster × category-volume to every Howl call.
//   • prefers-reduced-motion: on first-ever visit (no localStorage) defaults to muted.
//     (Current default is already muted: true — this makes the intent explicit.)

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useSoundStore } from "@/lib/store/sound";

export type SoundKey = "pour" | "clink" | "cap" | "shutter" | "print" | "wobble" | "flip";

interface HowlInstance {
  play:    (sprite?: string) => number;
  stop:    (id?: number)    => void;
  fade:    (from: number, to: number, duration: number, id?: number) => void;
  volume:  (vol: number,  id?: number) => void;
  playing: (id?: number)  => boolean;
  unload:  ()             => void;
}

interface SoundContextValue {
  play:       (key: SoundKey) => void;
  muted:      boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  play:       () => {},
  muted:      true,
  toggleMute: () => {},
});

type SoundDef = { src: string; baseVol: number; preload: boolean };

const FX_DEFS: Record<SoundKey, SoundDef> = {
  pour:    { src: "/sounds/pour.mp3",    baseVol: 0.50, preload: true  },
  clink:   { src: "/sounds/clink.mp3",   baseVol: 0.55, preload: true  },
  cap:     { src: "/sounds/cap.mp3",     baseVol: 0.35, preload: false },
  shutter: { src: "/sounds/shutter.mp3", baseVol: 0.60, preload: false },
  print:   { src: "/sounds/print.mp3",   baseVol: 0.45, preload: false },
  wobble:  { src: "/sounds/wobble.mp3",  baseVol: 0.30, preload: false },
  flip:    { src: "/sounds/flip.mp3",    baseVol: 0.28, preload: false },
};

const AMBIENT_BASE_VOL = 0.08;
const AMBIENT_FADE_IN  = 3000; // ms
const AMBIENT_FADE_OUT = 1500; // ms

export function SoundProvider({ children }: { children: ReactNode }) {
  const { muted, toggle, volumeMaster, volumes } = useSoundStore();

  const HowlCtor  = useRef<(new (opts: object) => HowlInstance) | null>(null);
  const fxHowls   = useRef<Partial<Record<SoundKey, HowlInstance>>>({});
  const ambientRef     = useRef<HowlInstance | null>(null);
  const ambientPlayId  = useRef<number | undefined>(undefined);
  // Set to true on first explicit user toggle — prevents ambient auto-start on SSR-restored muted:false
  const hasInteracted  = useRef(false);
  // Snapshot for reading volumes inside muted-change effect without stale closure
  const volSnap = useRef({ master: volumeMaster, fx: volumes.fx, ambient: volumes.ambient });
  volSnap.current = { master: volumeMaster, fx: volumes.fx, ambient: volumes.ambient };

  // ── Prefers-reduced-motion first-load gate ──────────────────────────────
  useEffect(() => {
    const stored = typeof window !== "undefined"
      ? localStorage.getItem("drip-theka-sound")
      : null;
    if (!stored && typeof window !== "undefined") {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        useSoundStore.getState().setMuted(true);
      }
    }
  }, []);

  // ── Load Howler and create preloaded instances ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    import("howler").then(({ Howl }) => {
      if (cancelled) return;
      HowlCtor.current = Howl as unknown as (new (opts: object) => HowlInstance);

      // FX preloads
      (Object.entries(FX_DEFS) as [SoundKey, SoundDef][]).forEach(([key, def]) => {
        if (!def.preload || fxHowls.current[key]) return;
        fxHowls.current[key] = new Howl({
          src:     [def.src],
          volume:  def.baseVol * volSnap.current.master * volSnap.current.fx,
          html5:   true,
          preload: true,
        });
      });

      // Ambient
      if (!ambientRef.current) {
        ambientRef.current = new Howl({
          src:     ["/sounds/ambient.mp3"],
          loop:    true,
          volume:  0,
          html5:   true,
          preload: true,
        });
      }
    }).catch(() => {});

    return () => {
      cancelled = true;
      Object.values(fxHowls.current).forEach((h) => h?.unload());
      fxHowls.current = {};
      ambientRef.current?.stop();
      ambientRef.current?.unload();
      ambientRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Ambient: respond to muted changes ──────────────────────────────────
  useEffect(() => {
    const amb = ambientRef.current;
    if (!amb) return;

    if (!muted) {
      if (!hasInteracted.current) return; // don't auto-start on restored state
      const target = AMBIENT_BASE_VOL * volSnap.current.master * volSnap.current.ambient;
      if (!amb.playing(ambientPlayId.current)) {
        amb.volume(0);
        ambientPlayId.current = amb.play();
        amb.fade(0, target, AMBIENT_FADE_IN, ambientPlayId.current);
      }
    } else {
      if (amb.playing(ambientPlayId.current)) {
        const cur = AMBIENT_BASE_VOL * volSnap.current.master * volSnap.current.ambient;
        amb.fade(cur, 0, AMBIENT_FADE_OUT, ambientPlayId.current);
        const id = ambientPlayId.current;
        setTimeout(() => amb.stop(id), AMBIENT_FADE_OUT + 100);
      }
    }
  }, [muted]);

  // ── Real-time ambient volume update ────────────────────────────────────
  useEffect(() => {
    const amb = ambientRef.current;
    if (!amb || muted || !amb.playing(ambientPlayId.current)) return;
    amb.volume(AMBIENT_BASE_VOL * volumeMaster * volumes.ambient, ambientPlayId.current);
  }, [volumeMaster, volumes.ambient, muted]);

  // ── Real-time FX volume update ──────────────────────────────────────────
  useEffect(() => {
    (Object.entries(fxHowls.current) as [SoundKey, HowlInstance][]).forEach(([key, howl]) => {
      howl.volume(FX_DEFS[key].baseVol * volumeMaster * volumes.fx);
    });
  }, [volumeMaster, volumes.fx]);

  // ── play() — lazy-create + fire ────────────────────────────────────────
  const play = useCallback(
    (key: SoundKey) => {
      if (muted) return;
      const def = FX_DEFS[key];

      // Lazy instantiation for non-preloaded sounds
      if (!fxHowls.current[key] && HowlCtor.current) {
        fxHowls.current[key] = new HowlCtor.current({
          src:   [def.src],
          volume: def.baseVol * volSnap.current.master * volSnap.current.fx,
          html5:  true,
        });
      }

      const howl = fxHowls.current[key];
      if (!howl) return;
      howl.volume(def.baseVol * volSnap.current.master * volSnap.current.fx);
      howl.play();
    },
    [muted]
  );

  // ── toggleMute — sets hasInteracted flag ────────────────────────────────
  const toggleMute = useCallback(() => {
    hasInteracted.current = true;
    toggle();
  }, [toggle]);

  return (
    <SoundContext.Provider value={{ play, muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}

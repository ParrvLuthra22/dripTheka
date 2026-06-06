import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundStore {
  // primary toggle (kept as muted for backward compat across codebase)
  muted: boolean;
  volumeMaster: number;
  volumes: { ambient: number; fx: number };
  // actions
  toggle: () => void;
  setMuted: (muted: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setVolume: (master: number) => void;
  setAmbientVolume: (vol: number) => void;
  setFxVolume: (vol: number) => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      muted:        true,
      volumeMaster: 0.6,
      volumes:      { ambient: 0.3, fx: 0.7 },
      toggle:           () => set((s) => ({ muted: !s.muted })),
      setMuted:         (muted)   => set({ muted }),
      setEnabled:       (enabled) => set({ muted: !enabled }),
      setVolume:        (master)  => set({ volumeMaster: master }),
      setAmbientVolume: (vol)     => set((s) => ({ volumes: { ...s.volumes, ambient: vol } })),
      setFxVolume:      (vol)     => set((s) => ({ volumes: { ...s.volumes, fx: vol } })),
    }),
    { name: "drip-theka-sound" }
  )
);

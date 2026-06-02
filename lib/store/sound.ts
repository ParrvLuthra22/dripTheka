import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SoundStore {
  muted: boolean;
  toggle: () => void;
  setMuted: (muted: boolean) => void;
}

export const useSoundStore = create<SoundStore>()(
  persist(
    (set) => ({
      muted: true, // muted by default per brand spec
      toggle: () => set((s) => ({ muted: !s.muted })),
      setMuted: (muted) => set({ muted }),
    }),
    { name: "drip-theka-sound" }
  )
);

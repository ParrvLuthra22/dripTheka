import { create } from "zustand";

interface HangoverStore {
  isHungover: boolean;
  setHungover: (v: boolean) => void;
}

export const useHangoverStore = create<HangoverStore>()((set) => ({
  isHungover: false,
  setHungover: (isHungover) => set({ isHungover }),
}));

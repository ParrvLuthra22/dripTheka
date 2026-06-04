"use client";

// AudioReactive — reads the ambient Howler track's audio levels and
// drives a CSS custom property --audio-level on the document root.
//
// Components can use `var(--audio-level)` (0–1) to subtly pulse when
// sound is ON. Cobalt sections get a radial glow that breathes with the music.
//
// Web Audio API is lazy-loaded to avoid touching audio permissions on mount.
// Only activates when:
//   • Sound is ON (Zustand store)
//   • User has interacted with the page (browser requires gesture for AudioContext)

import { useEffect, useRef } from "react";
import { useSoundStore } from "@/lib/store/sound";

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let source: MediaElementAudioSourceNode | null = null;

function initAnalyser(audioEl: HTMLAudioElement) {
  if (analyser) return analyser;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 32; // very coarse — we only need overall amplitude
    analyser.smoothingTimeConstant = 0.85;
    source = audioCtx.createMediaElementSource(audioEl);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
  } catch { /* Web Audio not available or already connected */ }
  return analyser;
}

export function AudioReactive() {
  const { muted } = useSoundStore();
  const rafId     = useRef(0);
  const active    = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (muted) {
      // Fade CSS var back to 0
      active.current = false;
      document.documentElement.style.setProperty("--audio-level", "0");
      return;
    }

    // Find the Howler audio element (ambient.mp3)
    const findAudioEl = (): HTMLAudioElement | null => {
      const els = document.querySelectorAll("audio");
      for (const el of Array.from(els)) {
        if (el.src.includes("ambient")) return el as HTMLAudioElement;
      }
      return null;
    };

    let audioEl = findAudioEl();
    if (!audioEl) {
      // Retry a few times — Howler may not have mounted the element yet
      let retries = 0;
      const retry = setInterval(() => {
        audioEl = findAudioEl();
        if (audioEl || retries++ > 20) clearInterval(retry);
        if (audioEl) startLoop(audioEl);
      }, 500);
      return () => clearInterval(retry);
    }

    startLoop(audioEl);

    function startLoop(el: HTMLAudioElement) {
      const node = initAnalyser(el);
      if (!node) return;

      active.current = true;
      const data = new Uint8Array(node.frequencyBinCount);

      const tick = () => {
        if (!active.current) return;
        node.getByteFrequencyData(data);
        // Average amplitude across all bins, normalise to 0–1
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        const level = Math.min(1, avg / 128);
        document.documentElement.style.setProperty("--audio-level", level.toFixed(3));
        rafId.current = requestAnimationFrame(tick);
      };

      // Try to resume AudioContext (needed after user gesture)
      if (audioCtx?.state === "suspended") {
        audioCtx.resume().then(() => {
          rafId.current = requestAnimationFrame(tick);
        });
      } else {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    return () => {
      active.current = false;
      cancelAnimationFrame(rafId.current);
      document.documentElement.style.setProperty("--audio-level", "0");
    };
  }, [muted]);

  return null; // no DOM output — just drives the CSS var
}

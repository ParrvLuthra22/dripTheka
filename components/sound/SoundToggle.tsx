"use client";

// SoundToggle — fixed bottom-left, mix-blend-mode difference.
//
// Tap → toggle sound on/off (ambient fades in/out via SoundProvider).
// Long-press 500ms or right-click → volume panel with ambient + fx sliders.
// Panel closes on click outside or Escape.

import { useEffect, useRef, useState } from "react";
import { useSound } from "@/components/sound/SoundProvider";
import { useSoundStore } from "@/lib/store/sound";

const BARS      = [5, 10, 7, 14, 8, 11, 5] as const;
const DURATIONS = [600, 480, 700, 520, 640, 500, 680] as const;
const DELAYS    = [  0,  80, 160,  40, 120, 200,  60] as const;

export function SoundToggle() {
  const { muted, toggleMute, play } = useSound();
  const { volumeMaster, volumes, setAmbientVolume, setFxVolume } = useSoundStore();

  const [panelOpen, setPanelOpen] = useState(false);
  const wrapperRef      = useRef<HTMLDivElement>(null);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress    = useRef(false);

  // ── Long-press detection ─────────────────────────────────────────────
  function handlePointerDown() {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      setPanelOpen(true);
    }, 500);
  }

  function handlePointerUp() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleClick() {
    if (didLongPress.current) return; // long press already handled
    toggleMute();
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    setPanelOpen((o) => !o);
  }

  // ── Close on outside click or Escape ────────────────────────────────
  useEffect(() => {
    if (!panelOpen) return;
    function onMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  return (
    <div
      ref={wrapperRef}
      className="fixed bottom-7 left-6 z-[60] hidden sm:block"
      style={{ position: "fixed" }}
    >
      {/* ── Volume panel ────────────────────────────────────────────── */}
      {panelOpen && (
        <div
          role="dialog"
          aria-label="Sound mix"
          className="absolute bottom-full mb-3 left-0 w-52 bg-[--cream] border border-[--ink]/12 shadow-[0_4px_20px_rgba(20,21,24,0.08)]"
          style={{ padding: "14px 16px" }}
        >
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[--ink]/30 mb-4">
            Sound Mix
          </p>

          {/* Ambient slider */}
          <label
            className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--ink]/50 flex items-center justify-between mb-1.5"
            htmlFor="slider-ambient"
          >
            Ambient
            <span className="text-[--ink]/30">{Math.round(volumes.ambient * 100)}</span>
          </label>
          <input
            id="slider-ambient"
            type="range"
            min={0} max={1} step={0.01}
            value={volumes.ambient}
            onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
            aria-label="Ambient volume"
            className="w-full h-[2px] appearance-none bg-[--ink]/15 accent-[--blue] cursor-pointer"
          />

          {/* FX slider */}
          <label
            className="font-mono text-[8px] uppercase tracking-[0.12em] text-[--ink]/50 flex items-center justify-between mt-3.5 mb-1.5"
            htmlFor="slider-fx"
          >
            Effects
            <span className="text-[--ink]/30">{Math.round(volumes.fx * 100)}</span>
          </label>
          <input
            id="slider-fx"
            type="range"
            min={0} max={1} step={0.01}
            value={volumes.fx}
            onChange={(e) => setFxVolume(parseFloat(e.target.value))}
            aria-label="Effects volume"
            className="w-full h-[2px] appearance-none bg-[--ink]/15 accent-[--blue] cursor-pointer"
          />

          {/* Test button */}
          <button
            onClick={() => play("clink")}
            className="mt-4 w-full font-mono text-[8px] uppercase tracking-[0.14em] text-[--ink]/40 border border-[--ink]/15 py-2 hover:border-[--ink]/40 hover:text-[--ink]/70 transition-colors duration-150"
          >
            Test ·&thinsp;Clink
          </button>

          {/* Small arrow pointing down to toggle */}
          <span
            aria-hidden="true"
            className="absolute bottom-[-5px] left-4 w-2.5 h-2.5 bg-[--cream] border-r border-b border-[--ink]/12 rotate-45"
          />
        </div>
      )}

      {/* ── Toggle button ───────────────────────────────────────────── */}
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        aria-label={muted ? "Enable sound" : "Mute sound"}
        aria-pressed={!muted}
        data-hover
        className={[
          "flex items-center gap-2",
          "text-white [mix-blend-mode:difference]",
          "font-mono text-[9px] uppercase tracking-[0.14em]",
          "cursor-pointer select-none",
          "transition-opacity duration-200 hover:opacity-70",
        ].join(" ")}
      >
        {/* Animated waveform */}
        <span className="flex items-end gap-[2px]" aria-hidden="true" style={{ height: 14 }}>
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
      </button>

      <style>{`
        @keyframes waveform-bar {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

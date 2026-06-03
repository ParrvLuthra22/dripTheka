"use client";

// HeroParticles — tsParticles canvas for the hero section.
// Cream dot/link network particles on the brand blue (#004AAD) bg.
// Uses @tsparticles/react v3 API: initParticlesEngine hook.

import { useCallback } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

const OPTIONS: ISourceOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    events: {
      onHover: { enable: true, mode: "grab" },
      onClick: { enable: true, mode: "push" },
      resize:  { enable: true },
    },
    modes: {
      grab: { distance: 180, links: { opacity: 0.3 } },
      push: { quantity: 2 },
    },
  },
  particles: {
    color:  { value: "#E4E2DD" },
    links: {
      color:    "#E4E2DD",
      distance: 150,
      enable:   true,
      opacity:  0.3,
      width:    1,
    },
    move: {
      direction: "none",
      enable:    true,
      outModes:  { default: "bounce" },
      random:    true,
      speed:     0.8,
      straight:  false,
    },
    number: {
      density: { enable: true },
      value:   120,
    },
    opacity: {
      value:     { min: 0.3, max: 0.8 },
      animation: { enable: true, speed: 1 },
    },
    shape: { type: "circle" },
    size:  { value: { min: 1, max: 4 } },
  },
  detectRetina: true,
};

export function HeroParticles() {
  const init = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <ParticlesProvider init={init}>
      <Particles
        id="hero-particles"
        className="absolute inset-0 z-[1] pointer-events-none"
        options={OPTIONS}
      />
    </ParticlesProvider>
  );
}

// (site) layout — wraps every public-facing page.
//
// Provider order (innermost first):
//   SoundProvider  → global Howler + sound state
//   SmoothScroll   → Lenis + GSAP ScrollTrigger shared ticker
//   PourTransition → cream overlay on route changes
//   Nav            → fixed top, cobalt, with morph target
//   main           → page content
//   Footer         → ink background + video header
//
// Fixed/global overlays (z-index order, lowest → highest):
//   MorphingLogo       → z-45  — hero → nav scroll-driven logo morph
//   ScrollProgressDrip → z-30  — right-edge cobalt fill line + droplet
//   Cursor             → z-9999 — custom dot + ring + label, desktop only
//   SoundToggle        → z-60  — bottom-left ambient toggle
//   PintGlass          → z-40  — cart indicator, desktop only
//   ThekaEgg           → z-100 — keyboard easter egg (type "theka")
//   HappyHour          → z-100 — Konami easter egg
//   FounderSecret      → z-60  — scroll-to-bottom secret
//   ToastStack         → z-150 — cart/khata confirmation slips, bottom-right
//   UpsellModal        → z-200 — "anything else?" after Add to Cart
//   HangoverMode       → z-250 — idle toast (body.is-hungover class)
//   DrunkScroll        → z-250 — fast-scroll toast (body.is-wobbly class)
//   LoadingScreen      → z-200 — brand intro, once per session
//   Bouncer            → z-300 — 18+ age gate (above everything)

import { SmoothScroll }       from "@/components/motion/SmoothScroll";
import { SoundProvider }      from "@/components/sound/SoundProvider";
import { SoundToggle }        from "@/components/sound/SoundToggle";
import { Nav }                from "@/components/sections/Nav";
import { Footer }             from "@/components/sections/Footer";
import { PintGlass }          from "@/components/glass/PintGlass";
import { PourTransition }     from "@/components/transitions/PourTransition";
import { Cursor }             from "@/components/ui/Cursor";
import { ToastStack }         from "@/components/ui/ToastStack";
import { UpsellModal }        from "@/components/ui/UpsellModal";
import { LoadingScreen }      from "@/components/layout/LoadingScreen";
import { Bouncer }            from "@/components/layout/Bouncer";
import { ThekaEgg }           from "@/components/layout/ThekaEgg";
import { HappyHour }          from "@/components/layout/HappyHour";
import { FounderSecret }      from "@/components/layout/FounderSecret";
import { MorphingLogo }       from "@/components/glass/MorphingLogo";
import { ScrollProgressDrip } from "@/components/motion/ScrollProgressDrip";
import { AudioReactive }      from "@/components/motion/AudioReactive";
import { HangoverMode }       from "@/components/motion/HangoverMode";
import { DrunkScroll }        from "@/components/motion/DrunkScroll";
import { Foam }              from "@/components/motion/Foam";
import { ContrastDevTool }   from "@/components/dev/ContrastDevTool";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SoundProvider>
      <SmoothScroll>
        <PourTransition>
          <Nav />

          <main className="flex flex-col min-h-screen" style={{ paddingTop: "var(--header-h)" }}>
            {children}
          </main>

          <Footer />
        </PourTransition>
      </SmoothScroll>

      {/* Global foam bubble renderer — event-driven, max 5 on screen */}
      <Foam />

      {/* Fixed global chrome */}
      <PintGlass />
      <SoundToggle />
      <Cursor />
      <ToastStack />
      <UpsellModal />

      {/* The signature moment — scroll-driven logo morph */}
      <MorphingLogo />

      {/* Audio-reactive: drives --audio-level CSS var when ambient plays */}
      <AudioReactive />

      {/* Right-edge scroll progress indicator */}
      <ScrollProgressDrip />

      {/* Self-aware interactive states */}
      <HangoverMode />
      <DrunkScroll />

      {/* Easter eggs */}
      <ThekaEgg />
      <HappyHour />
      <FounderSecret />

      {/* First-session brand intro */}
      <LoadingScreen />

      {/* Dev-only contrast checker — tree-shaken in production */}
      {process.env.NODE_ENV === "development" && <ContrastDevTool />}

      {/* 18+ age gate — z-[300], above everything. Legal pages exempt. */}
      <Bouncer />

      {/* Grain filter definition — rendered once, referenced by all <Grain> instances */}
      <svg
        aria-hidden="true"
        focusable="false"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      >
        <defs>
          <filter id="dt-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="linearRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
        </defs>
      </svg>
    </SoundProvider>
  );
}

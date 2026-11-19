// SiteShell — the Theka shell. Every (site) room inherits it via app/(site)/layout.tsx;
// the (bar) product page also wraps its legacy (non-wall) layout in it.
//
// Shell (components/theka/):
//   SmoothScroll   → Lenis + GSAP ticker; native scroll under reduced motion
//   PourTransition → cobalt shutter wipe between routes (fade if reduced)
//   Nav / Footer   → cobalt top bar, ink sign-off; strings from lib/theka/lang
//   Grain          → fixed SVG noise over the page (no blend mode)
//   Cursor         → dot + lerped ring + label; CSS-gated to fine pointers
//
// Fixed/global overlays (z-index, lowest → highest):
//   ScrollProgressDrip → 30   · PintGlass → 40 · MorphingLogo → 45
//   Nav                → --z-nav (50)       · SoundToggle / FounderSecret → 60
//   Grain (page)       → --z-grain (70)     · easter eggs → 100
//   ToastStack 150 · UpsellModal / LoadingScreen 200 · Hangover / Drunk 250
//   PourTransition     → --z-shutter (400)  · Cursor → --z-cursor (9999)

import { SessionProvider }     from "@/components/providers/SessionProvider";
import { SmoothScroll }       from "@/components/theka/SmoothScroll";
import { SoundProvider }      from "@/components/sound/SoundProvider";
import { SoundToggle }        from "@/components/sound/SoundToggle";
import { Nav }                from "@/components/theka/Nav";
import { Footer }             from "@/components/theka/Footer";
import { Grain }              from "@/components/theka/Grain";
import { PintGlass }          from "@/components/glass/PintGlass";
import { PourTransition }     from "@/components/theka/PourTransition";
import { Cursor }             from "@/components/theka/Cursor";
import { ToastStack }         from "@/components/ui/ToastStack";
import { UpsellModal }        from "@/components/ui/UpsellModal";
import { LoadingScreen }      from "@/components/layout/LoadingScreen";
import { ThekaEgg }           from "@/components/layout/ThekaEgg";
import { HappyHour }          from "@/components/layout/HappyHour";
import { FounderSecret }      from "@/components/layout/FounderSecret";
import { MorphingLogo }       from "@/components/glass/MorphingLogo";
import { ScrollProgressDrip } from "@/components/motion/ScrollProgressDrip";
import { AudioReactive }      from "@/components/motion/AudioReactive";
import { HangoverMode }       from "@/components/motion/HangoverMode";
import { DrunkScroll }        from "@/components/motion/DrunkScroll";
import { Foam }              from "@/components/motion/Foam";
import { SurfaceTracker }    from "@/components/motion/SurfaceTracker";
import { ContrastDevTool }   from "@/components/dev/ContrastDevTool";

export function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
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

      {/* Resolves which declared surface sits behind the floating glass */}
      <SurfaceTracker />

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

      {/* Page grain — one fixed overlay, plain opacity, no blend mode */}
      <Grain fixed />
    </SoundProvider>
    </SessionProvider>
  );
}

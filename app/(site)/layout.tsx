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
// Fixed/global overlays:
//   MorphingLogo       → hero → nav scroll-driven logo morph
//   ScrollProgressDrip → right-edge cobalt fill line + droplet
//   Cursor             → custom dot + ring + label, desktop only
//   ThekaEgg           → keyboard easter egg (type "theka")
//   LoadingScreen      → fullscreen brand intro, once per session
//   PintGlass          → cart indicator (legacy — currently in nav)
//   SoundToggle        → bottom-left

import { SmoothScroll }       from "@/components/motion/SmoothScroll";
import { SoundProvider }      from "@/components/sound/SoundProvider";
import { SoundToggle }        from "@/components/sound/SoundToggle";
import { Nav }                from "@/components/sections/Nav";
import { Footer }             from "@/components/sections/Footer";
import { PintGlass }          from "@/components/glass/PintGlass";
import { PourTransition }     from "@/components/transitions/PourTransition";
import { Cursor }             from "@/components/ui/Cursor";
import { LoadingScreen }      from "@/components/layout/LoadingScreen";
import { ThekaEgg }           from "@/components/layout/ThekaEgg";
import { HappyHour }          from "@/components/layout/HappyHour";
import { FounderSecret }      from "@/components/layout/FounderSecret";
import { MorphingLogo }       from "@/components/glass/MorphingLogo";
import { ScrollProgressDrip } from "@/components/motion/ScrollProgressDrip";
import { AudioReactive }      from "@/components/motion/AudioReactive";

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

      {/* Fixed global chrome */}
      <PintGlass />
      <SoundToggle />
      <Cursor />

      {/* The signature moment — scroll-driven logo morph */}
      <MorphingLogo />

      {/* Audio-reactive: drives --audio-level CSS var when ambient plays */}
      <AudioReactive />

      {/* Right-edge scroll progress indicator */}
      <ScrollProgressDrip />

      {/* Easter eggs */}
      <ThekaEgg />
      <HappyHour />
      <FounderSecret />

      {/* First-session brand intro */}
      <LoadingScreen />
    </SoundProvider>
  );
}

// (site) layout — wraps every public-facing page.
//
// Provider order (innermost first):
//   SoundProvider  → global Howler + sound state
//   SmoothScroll   → Lenis + GSAP ScrollTrigger shared ticker
//   PourTransition → cream overlay on route changes
//   Nav            → fixed top, theme-aware tone detection
//   main           → page content
//   Footer         → ink background, parallax wordmark
//
// Fixed/global overlays:
//   PintGlass      → cart indicator, desktop only
//   SoundToggle    → bottom-left
//   Cursor         → custom dot + ring, desktop only
//   LoadingScreen  → fullscreen brand intro, once per session

import { SmoothScroll }    from "@/components/motion/SmoothScroll";
import { SoundProvider }   from "@/components/sound/SoundProvider";
import { SoundToggle }     from "@/components/sound/SoundToggle";
import { Nav }             from "@/components/sections/Nav";
import { Footer }          from "@/components/sections/Footer";
import { PintGlass }       from "@/components/glass/PintGlass";
import { PourTransition }  from "@/components/transitions/PourTransition";
import { Cursor }          from "@/components/ui/Cursor";
import { LoadingScreen }   from "@/components/layout/LoadingScreen";

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

      {/* First-session brand intro — sits above everything (z-200) */}
      <LoadingScreen />
    </SoundProvider>
  );
}

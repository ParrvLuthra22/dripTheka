// (site) layout — wraps every public-facing page.
//
// Provider order (innermost first):
//   SoundProvider → global Howler + sound state
//   SmoothScroll  → Lenis + GSAP ScrollTrigger shared ticker
//   PourTransition → cream overlay on route changes
//   Nav           → fixed top, mix-blend difference
//   main          → page content
//   Footer        → ink background, parallax wordmark
//
// Fixed/global overlays (not inside scroll container):
//   PintGlass     → cart indicator, desktop only (fixed bottom-right)
//   SoundToggle   → bottom-left, mix-blend difference
//   Cursor        → custom dot + ring, desktop only

import { SmoothScroll }    from "@/components/motion/SmoothScroll";
import { SoundProvider }   from "@/components/sound/SoundProvider";
import { SoundToggle }     from "@/components/sound/SoundToggle";
import { Nav }             from "@/components/sections/Nav";
import { Footer }          from "@/components/sections/Footer";
import { PintGlass }       from "@/components/glass/PintGlass";
import { PourTransition }  from "@/components/transitions/PourTransition";
import { Cursor }          from "@/components/ui/Cursor";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SoundProvider>
      <SmoothScroll>
        {/* Pour-in / pour-out overlay sits above everything */}
        <PourTransition>
          <Nav />

          <main className="flex flex-col min-h-screen" style={{ paddingTop: "var(--header-h)" }}>
            {children}
          </main>

          <Footer />
        </PourTransition>
      </SmoothScroll>

      {/* Fixed global chrome — outside scroll container so Lenis doesn't affect them */}
      <PintGlass />
      <SoundToggle />
      <Cursor />
    </SoundProvider>
  );
}

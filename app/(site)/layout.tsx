// (site) layout — all public-facing routes.
// Houses: smooth scroll, sound, nav, floating pint glass cart, footer.

import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SoundProvider } from "@/components/sound/SoundProvider";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { PintGlass } from "@/components/glass/PintGlass";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SoundProvider>
      <SmoothScroll>
        <Nav />
        <main
          style={{ paddingTop: "var(--header-h)" }}
          className="flex flex-col min-h-screen"
        >
          {children}
        </main>
        <Footer />

        {/* Floating pint glass — desktop only, hidden on mobile via PintGlass internals */}
        <PintGlass />
      </SmoothScroll>
    </SoundProvider>
  );
}

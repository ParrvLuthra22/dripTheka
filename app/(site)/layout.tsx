// (site) layout — all public-facing routes.
// Houses: smooth scroll, sound, nav, footer, cart drawer.

import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SoundProvider } from "@/components/sound/SoundProvider";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

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
      </SmoothScroll>
    </SoundProvider>
  );
}

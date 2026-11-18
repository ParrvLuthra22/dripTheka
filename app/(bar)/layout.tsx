// (bar) layout — the home route's minimal shell.
//
// The Bar is a fixed, full-screen experience with its own nav, cursor and
// grain, so it does NOT inherit the (site) chrome (Nav, Footer, global Cursor,
// MorphingLogo, PintGlass, LoadingScreen…). It keeps only the legal 18+
// Bouncer (which needs SoundProvider for its clink).

import { SoundProvider } from "@/components/sound/SoundProvider";
import { Bouncer }       from "@/components/layout/Bouncer";

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      {children}
      <Bouncer />
    </SoundProvider>
  );
}

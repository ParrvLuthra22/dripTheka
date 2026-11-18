// (bar) layout — the home route's minimal shell.
//
// The Bar is a fixed, full-screen experience with its own nav, cursor and
// grain, so it does NOT inherit the (site) chrome (Nav, Footer, global Cursor,
// MorphingLogo, PintGlass, LoadingScreen…). No age block: the Gate's
// "21+ · the theka has rules…" line is flavour text only.

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

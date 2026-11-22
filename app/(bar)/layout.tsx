// (bar) layout — the home route's minimal shell.
//
// The Wall is a fixed, full-screen experience with its own header, lighting and
// grain, so it does NOT inherit the (site) chrome (Nav, Footer, global Cursor,
// Grain, MorphingLogo, PintGlass, LoadingScreen…) — the wall uses the native
// pointer and its plaster texture already carries the grain. No age block.

import { TabHost } from "@/components/theka/tab/TabHost";

export default function BarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}<TabHost /></>;
}

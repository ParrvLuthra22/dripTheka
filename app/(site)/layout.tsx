// (site) layout — every room under (site) inherits the Theka shell.
// The shell itself lives in components/theka/SiteShell.tsx so the (bar) product
// page can reuse it for products that have no wall art yet.

import { SiteShell } from "@/components/theka/SiteShell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}

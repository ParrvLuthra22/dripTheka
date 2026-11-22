"use client";

// Mounted once in the (bar) layout. The drawer's code (and Razorpay) only load the first time a visitor opens the
// tab — the Wall's first paint pays nothing for it. After that it stays mounted (hidden) so closing is instant.

import { useState } from "react";
import dynamic from "next/dynamic";
import { useCartStore } from "@/lib/store/cart";

const TabDrawer = dynamic(() => import("./TabDrawer"), { ssr: false });

export function TabHost() {
  const open = useCartStore((s) => s.isOpen);
  const [everOpened, setEverOpened] = useState(false);
  if (open && !everOpened) setEverOpened(true);
  return everOpened ? <TabDrawer /> : null;
}

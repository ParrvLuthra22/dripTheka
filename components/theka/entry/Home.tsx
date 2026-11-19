"use client";

// Home — the Entry in front of the Wall. <TheWall> is always rendered (full-screen,
// 1:1); the Entry is a fixed overlay on top of it for a first visit. On completion the
// Entry unmounts, the scroll track goes with it, scrollY returns to 0 and the Wall
// takes over — it never moved, so nothing jumps.
//
//   boot     server + first client render. The Wall is held (no intro) until we know.
//   playing  Entry on top, Wall is a non-interactive backdrop.
//   done     Entry gone. handoff=true → chrome fades in; false → the Wall's normal opening.

import { useLayoutEffect, useState } from "react";
import type { WallProduct } from "@/data/pour-001";
import { TheWall } from "../wall/TheWall";
import { Entry } from "./Entry";
import { markEntered, shouldPlayEntry } from "./entryGate";

type Phase = "boot" | "playing" | "done";

export function Home({ products }: { products: WallProduct[] }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [handoff, setHandoff] = useState(false);

  // Decide before first paint (children's layout effects have already held the Wall).
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage/URL are only readable on the client
    setPhase(shouldPlayEntry() ? "playing" : "done");
  }, []);

  const finish = () => {
    markEntered();
    setHandoff(true);
    setPhase("done");
  };

  // Entry (and its 900vh track) are unmounted in the same commit; park the page at the top.
  useLayoutEffect(() => {
    if (phase === "done") window.scrollTo(0, 0);
  }, [phase]);

  return (
    <>
      <TheWall products={products} entering={phase !== "done"} handoff={handoff} />
      {phase === "playing" && <Entry onDone={finish} />}
    </>
  );
}

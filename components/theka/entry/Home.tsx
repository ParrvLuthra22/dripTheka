"use client";

// Home — the Entry in front of the Wall. <TheWall> is always rendered (full-screen,
// 1:1); the Entry is a fixed overlay on top of it for a first visit. On completion the
// Entry unmounts, the scroll track goes with it, scrollY returns to 0 and the Wall
// takes over — it never moved, so nothing jumps.
//
//   boot     server + first client render. The Entry's first frame (night sky, wordmark,
//            scroll cue) is already in the HTML; the Wall is held under it. If the pre-paint
//            script set `dt-skip-entry` on <html>, CSS hides that frame instead.
//   playing  Entry journey on top, Wall is a non-interactive backdrop.
//   done     Entry gone. handoff=true → chrome fades in; false → the Wall's normal opening.

import { useLayoutEffect, useState } from "react";
import type { WallProduct } from "@/data/pour-001";
import { TheWall } from "../wall/TheWall";
import { Entry } from "./Entry";
import { ENTRY_SKIP_CLASS, markEntered, shouldPlayEntry } from "./entryGate";

type Phase = "boot" | "playing" | "done";

export function Home({ products }: { products: WallProduct[] }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [handoff, setHandoff] = useState(false);
  // Read on the client only; the server and the first client render both assume false.
  const [reduced, setReduced] = useState(false);

  // Decide before first paint (children's layout effects have already held the Wall).
  useLayoutEffect(() => {
    const play = shouldPlayEntry();
    // A stale class (deep link earlier, soft-navigated back here) must not hide a real Entry.
    if (play) document.documentElement.classList.remove(ENTRY_SKIP_CLASS);
    /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage/URL/media are only readable on the client */
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPhase(play ? "playing" : "done");
    /* eslint-enable react-hooks/set-state-in-effect */
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
      {phase !== "done" && <Entry playing={phase === "playing"} reduced={reduced} onDone={finish} />}
    </>
  );
}

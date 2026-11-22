"use client";

// Home — the Entry in front of the Wall. <TheWall> is always rendered (full-screen, 1:1); the
// Entry is a fixed overlay on top of it, and it NEVER unmounts: it keeps its scroll track, so the
// journey is reversible. Who is on top is decided by `live`:
//
//   live=false  the Entry plays (or is parked at the top): the Wall is a dormant, non-interactive
//               backdrop seen through the doorway hole.
//   live=true   the journey reached its end (progress ≥ .999): the Wall is interactive with its
//               chrome visible, the Entry layers are hidden. Scrolling up at the top of the Wall
//               calls onExitUp → the Entry walks back out (shutter, street, lane, clouds).
//
//   boot        server + first client render. The Entry's first frame (night sky, wordmark, scroll
//               cue) is already in the HTML; the Wall is held under it. If the pre-paint script set
//               `dt-skip-entry` on <html> ("start at the end"), CSS hides that frame instead.
//   play        a fresh visit: the journey from the clouds.
//   start-live  returning visitor / ?fit= deep link: the Entry jumps to the end of its track and is
//               live before first paint; the Wall's own lights-on (or deep-link zoom) plays.
//
// Imagery: the Wall holds its <img>s (no src) while the Entry plays, so it can't compete with the Entry's
// first paint. `load` opens the gates (wallLoad.ts): the Entry's timeline passing 1.2s / 3.8s, idle after
// LCP, or live. start-live opens everything before first paint.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { WallDesign } from "@/data/pour-001";
import { TheWall } from "../wall/TheWall";
import { LOAD_ALL, LOAD_HOLD, afterLcpIdle, loadAtTime, openGates, type WallLoad } from "../wall/wallLoad";
import { Entry, type EntryHandle } from "./Entry";
import { ENTRY_SKIP_CLASS, markEntered, shouldPlayEntry } from "./entryGate";

type Phase = "boot" | "play" | "start-live";

export function Home({ designs }: { designs: WallDesign[] }) {
  const [phase, setPhase] = useState<Phase>("boot");
  const [live, setLive] = useState(false);
  // Read on the client only; the server and the first client render both assume false.
  const [reduced, setReduced] = useState(false);
  const [load, setLoad] = useState<WallLoad>(LOAD_HOLD);
  const entry = useRef<EntryHandle>(null);

  // Decide before first paint (children's layout effects have already held the Wall).
  useLayoutEffect(() => {
    const play = shouldPlayEntry();
    // A stale class (deep link earlier, soft-navigated back here) must not hide a real Entry.
    if (play) document.documentElement.classList.remove(ENTRY_SKIP_CLASS);
    /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage/URL/media are only readable on the client */
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPhase(play ? "play" : "start-live");
    if (!play) setLoad(LOAD_ALL); // returning visitor / deep link: nothing to hold back
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const onLive = (on: boolean) => {
    if (on) { markEntered(); setLoad(LOAD_ALL); }
    setLive(on);
  };
  // The Entry's playhead: 1.2s = the aerial (backs + shadows), 3.8s = the street (neon).
  const onTime = useCallback((t: number) => setLoad((prev) => openGates(prev, loadAtTime(t))), []);

  // Scrolling is what moves the timeline, so a visitor who lingers on the sky would otherwise never reach
  // 1.2s: open the art on idle after LCP as well.
  useEffect(() => afterLcpIdle(() => setLoad((prev) => openGates(prev, { art: true }))), []);

  return (
    <>
      <TheWall
        designs={designs}
        dormant={!live}
        load={load}
        handoff={phase === "play"}
        onExitUp={reduced ? undefined : () => entry.current?.exitUp()}
      />
      <Entry
        ref={entry}
        playing={phase !== "boot"}
        reduced={reduced}
        startLive={phase === "start-live"}
        onLive={onLive}
        onTime={onTime}
      />
    </>
  );
}

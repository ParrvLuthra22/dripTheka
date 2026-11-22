"use client";

// useGlasses() — the live glasses of the pour, or null.
//
//   const glasses = useGlasses();                 // fetch now + every 60 s while the tab is visible
//   const glasses = useGlasses({ live: false });  // read only (the Wall is asleep under the Entry; BuyPanel just reads)
//   glasses?.get("janwar")?.state                 // "open" | "last" | "tapped"
//
// null means "unavailable" — the request failed, the body was off-shape, or nothing has loaded yet. Callers then
// draw no glass and no number at all; buying still works. One shared store: every consumer sees the same fetch.

import { useEffect, useSyncExternalStore } from "react";
import { POUR } from "@/lib/config";
import { parseGlasses, type GlassInfo, type GlassMap } from "./glassMath";

export type { GlassInfo, GlassMap };

export const GLASSES_REFRESH_MS = 60_000;
const url = `/api/pour/${POUR.id}/glasses`;

let current: GlassMap | null = null;
let fetchedAt = 0;
let inflight: Promise<void> | null = null;
let live = 0;
let timer = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

async function load(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    let next: GlassMap | null = null;
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) next = parseGlasses(await res.json());
    } catch { /* offline / DB down: no glasses */ }
    fetchedAt = Date.now();
    current = next;                // a failed refresh CLEARS the glasses — a stale number is an invented number
    emit();
  })().finally(() => { inflight = null; });
  return inflight;
}

const visible = () => typeof document === "undefined" || document.visibilityState !== "hidden";
const onVisible = () => { if (visible() && Date.now() - fetchedAt > GLASSES_REFRESH_MS / 2) void load(); };

function start() {
  void load();
  timer = window.setInterval(() => { if (visible()) void load(); }, GLASSES_REFRESH_MS);
  document.addEventListener("visibilitychange", onVisible);
}
function stop() {
  clearInterval(timer);
  document.removeEventListener("visibilitychange", onVisible);
}

export function useGlasses({ live: wantLive = true }: { live?: boolean } = {}): GlassMap | null {
  const data = useSyncExternalStore(
    (fn) => { subs.add(fn); return () => { subs.delete(fn); }; },
    () => current,
    () => null,
  );
  useEffect(() => {
    if (!wantLive) return;
    if (++live === 1) start();
    return () => { if (--live === 0) stop(); };
  }, [wantLive]);
  return data;
}

/** Test seam. */
export const __resetGlasses = () => { stop(); current = null; fetchedAt = 0; inflight = null; live = 0; emit(); };

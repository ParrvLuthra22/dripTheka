"use client";

// Who is signed in, for prefilling forms (name, email). Read once from NextAuth's /api/auth/session and shared.
// null = a guest (or auth isn't configured). Never blocks a form: it just fills fields when it arrives.

import { useEffect, useSyncExternalStore } from "react";

export interface SessionUser { name: string | null; email: string | null }

let user: SessionUser | null = null;
let asked = false;
const subs = new Set<() => void>();

async function ask() {
  if (asked) return;
  asked = true;
  try {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const body = res.ok ? ((await res.json()) as { user?: { name?: string | null; email?: string | null } } | null) : null;
    if (body?.user && (body.user.email || body.user.name)) {
      user = { name: body.user.name ?? null, email: body.user.email ?? null };
      subs.forEach((fn) => fn());
    }
  } catch { /* guest */ }
}

export function useSessionUser(enabled = true): SessionUser | null {
  const u = useSyncExternalStore((fn) => { subs.add(fn); return () => { subs.delete(fn); }; }, () => user, () => null);
  useEffect(() => { if (enabled) void ask(); }, [enabled]);
  return u;
}

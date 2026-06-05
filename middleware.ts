// middleware.ts — edge-compatible, runs before every non-static request.
//
// Responsibility: bot detection for the age-gate bouncer.
// If the request comes from a known crawler, set the dt_bouncer_passed cookie
// so the client component never shows the overlay → SEO pages render in full.
//
// If we ever add NextAuth session middleware, compose it here rather than
// creating a second middleware.ts (Next.js only allows one).

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME    = "dt_bouncer_passed";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/** Lower-cased user-agent substrings that identify crawlers / bots. */
const BOT_PATTERNS = [
  "googlebot", "bingbot", "slurp", "duckduckbot", "baiduspider",
  "yandexbot", "sogoubot", "exabot", "facebot", "facebookexternalhit",
  "ia_archiver", "twitterbot", "linkedinbot", "whatsapp", "discordbot",
  "slackbot", "telegrambot", "applebot", "semrushbot", "ahrefsbot",
  "mj12bot", "dotbot", "petalbot", "dataprovider", "aolbuild", "uptimerobot",
];

function isKnownBot(ua: string): boolean {
  const lower = ua.toLowerCase();
  return BOT_PATTERNS.some((pat) => lower.includes(pat));
}

export function middleware(request: NextRequest) {
  const ua       = request.headers.get("user-agent") ?? "";
  const hasCookie = request.cookies.has(COOKIE_NAME);

  // Bots bypass the bouncer: set the "passed" cookie so the client
  // component sees it immediately and renders nothing.
  if (isKnownBot(ua) && !hasCookie) {
    const response = NextResponse.next();
    response.cookies.set(COOKIE_NAME, "1", {
      maxAge:   COOKIE_MAX_AGE,
      sameSite: "lax",
      path:     "/",
    });
    return response;
  }

  return NextResponse.next();
}

// Run on all routes except _next internals and static assets.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico).*)",
  ],
};

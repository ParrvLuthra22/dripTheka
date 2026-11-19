// entryGate — who sees the Entry. First visit in a session plays it; after that (and for
// deep links like /?fit=slug) the home route goes straight to the Wall.
//
// The decision is made twice, with the same rule:
//   1. ENTRY_SKIP_SCRIPT runs inline while the HTML is parsed (before first paint) and puts
//      `dt-skip-entry` on <html>. CSS uses it to hide the server-rendered Entry frame.
//   2. shouldPlayEntry() runs in Home's layout effect and drives React state.

const KEY = "dt_entered";

/** Class on <html> that hides the server-rendered Entry frame (set by ENTRY_SKIP_SCRIPT). */
export const ENTRY_SKIP_CLASS = "dt-skip-entry";

/** Inline, synchronous, tiny. Storage blocked → skip (never trap someone in the Entry). */
export const ENTRY_SKIP_SCRIPT =
  `(function(){var d=document.documentElement;try{` +
  `if(/[?&]fit(=|&|$)/.test(location.search)||sessionStorage.getItem("${KEY}")==="1")d.classList.add("${ENTRY_SKIP_CLASS}")` +
  `}catch(e){d.classList.add("${ENTRY_SKIP_CLASS}")}})()`;

export function shouldPlayEntry(): boolean {
  try {
    if (new URLSearchParams(window.location.search).has("fit")) return false;
    return sessionStorage.getItem(KEY) !== "1";
  } catch {
    return false; // storage blocked → never trap someone in the Entry
  }
}

export function markEntered(): void {
  try { sessionStorage.setItem(KEY, "1"); } catch { /* private mode */ }
}

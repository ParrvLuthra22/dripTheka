// entryGate — who sees the Entry. First visit in a session plays it; after that (and for
// deep links like /?fit=slug) the home route goes straight to the Wall.

const KEY = "dt_entered";

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

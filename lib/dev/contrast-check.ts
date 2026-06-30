// WCAG contrast checker — dev-only, never imported in production builds.
// Call enableContrastCheck() once in layout inside a NODE_ENV guard.

function toLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function parseRgb(color: string): [number, number, number] | null {
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

function effectiveBg(el: Element): string {
  let node: Element | null = el;
  while (node && node !== document.documentElement) {
    const bg = window.getComputedStyle(node).backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
    node = node.parentElement;
  }
  return "rgb(255,255,255)";
}

function selector(el: Element): string {
  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== document.body && parts.length < 5) {
    let s = node.tagName.toLowerCase();
    if (node.id) s += `#${node.id}`;
    else if (typeof node.className === "string" && node.className.trim()) {
      s += "." + node.className.trim().split(/\s+/).slice(0, 2).join(".");
    }
    parts.unshift(s);
    node = node.parentElement;
  }
  return parts.join(" > ");
}

const throttle = new Map<string, number>();
const THROTTLE_MS = 30_000;
const report: { sel: string; fg: string; bg: string; ratio: string }[] = [];
let badgeAttached = false;

function attachBadge() {
  if (badgeAttached) return;
  badgeAttached = true;
  const badge = document.createElement("div");
  Object.assign(badge.style, {
    position: "fixed",
    bottom: "12px",
    left: "12px",
    zIndex: "99999",
    background: "#FF4D33",
    color: "#fff",
    font: "bold 10px/1 monospace",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    userSelect: "none",
    letterSpacing: "0.05em",
  });
  badge.textContent = "⚠ CONTRAST";
  badge.title = "Click to dump full contrast report";
  badge.addEventListener("click", () => {
    console.group("[contrast] Full session report");
    report.forEach((r) => console.log(`${r.ratio}:1 | FG: ${r.fg} | BG: ${r.bg}\n  ${r.sel}`));
    console.groupEnd();
  });
  document.body.appendChild(badge);
}

function warn(el: Element, fg: string, bg: string, ratio: number) {
  const key = selector(el) + fg + bg;
  const now = Date.now();
  if ((throttle.get(key) ?? 0) + THROTTLE_MS > now) return;
  throttle.set(key, now);

  const sel = selector(el);
  const r = ratio.toFixed(2);
  console.warn(`[contrast] ${r}:1 on ${sel}\n  FG: ${fg}  BG: ${bg}`);
  report.push({ sel, fg, bg, ratio: r });
  attachBadge();
}

function checkEl(el: Element) {
  const style = window.getComputedStyle(el);
  const fg = style.color;
  if (!fg) return;

  const fgRgb = parseRgb(fg);
  if (!fgRgb) return;

  const bg = effectiveBg(el);
  const bgRgb = parseRgb(bg);
  if (!bgRgb) return;

  const ratio = contrastRatio(
    luminance(...fgRgb),
    luminance(...bgRgb),
  );

  const fontSize = parseFloat(style.fontSize);
  const weight = parseInt(style.fontWeight);
  const isLarge = fontSize >= 24 || (fontSize >= 18.67 && weight >= 700);
  const threshold = isLarge ? 3.0 : 4.5;

  if (ratio < threshold) warn(el, fg, bg, ratio);
}

let rafPending = false;

function runCheck() {
  if (rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    rafPending = false;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (!node.textContent?.trim()) continue;
      const parent = (node as Text).parentElement;
      if (!parent || seen.has(parent)) continue;
      seen.add(parent);
      const s = window.getComputedStyle(parent);
      if (s.display === "none" || s.visibility === "hidden") continue;
      const r = parent.getBoundingClientRect();
      if (r.width > 0 && r.top < window.innerHeight && r.bottom > 0) {
        checkEl(parent);
      }
    }
  });
}

export function enableContrastCheck(): void {
  if (typeof window === "undefined") return;

  const start = () => {
    runCheck();
    const mo = new MutationObserver(runCheck);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", runCheck, { passive: true });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
}

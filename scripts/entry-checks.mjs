// Entry checks (Playwright). Run against a running server:
//   npm run build && npx next start -p 3100 &   then   node scripts/entry-checks.mjs [baseURL] [--no-shots]
// Screenshots → docs/reference/entry/checks/. Exits 1 on any failed assertion.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const OUT = new URL("../docs/reference/entry/checks/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`); };
const HYDRATION = /hydrat|#418|#419|#422|#423|#425|did not match|mismatch/i;

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

const browser = await chromium.launch();

async function open(opts, { entered = false, throttle = false, url = "/", reduced = false, blockJs = false } = {}) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && HYDRATION.test(m.text())) problems.push(m.text()); });
  page.on("pageerror", (e) => { if (HYDRATION.test(String(e))) problems.push(String(e)); });
  await page.addInitScript((entered) => {
    try { sessionStorage.setItem("dt_entry_debug", "1"); if (entered) sessionStorage.setItem("dt_entered", "1"); } catch {}
    // last timeline progress seen while the Entry was mounted
    window.__prog = 0; window.__rootGone = false;
    const tick = () => {
      const r = document.querySelector("[data-entry-root]");
      const tl = window.__dtEntry && window.__dtEntry.tl;
      if (r && tl) window.__prog = tl.progress();
      if (!r && window.__prog > 0 && !window.__rootGone) window.__rootGone = true;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, entered);
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  if (blockJs) await page.route("**/_next/static/**/*.js", (r) => r.abort());
  if (throttle) {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 300, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  }
  await page.goto(BASE + url, { waitUntil: blockJs ? "load" : "commit" });
  return { ctx, page, problems };
}
const ready = async (page) => { await page.waitForSelector("[data-entry-track]", { timeout: 90000 }); await page.waitForFunction(() => !!(window.__dtEntry && window.__dtEntry.tl), null, { timeout: 90000 }); };
const maxY = (page) => page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const goTo = async (page, p) => page.evaluate((p) => scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), p);
const settle = (page, p) => page.waitForFunction((p) => Math.abs(window.__dtEntry.tl.progress() - p) < 0.004, p, { timeout: 15000 });
const tlp = (page) => page.evaluate(() => window.__dtEntry?.tl.progress() ?? null);
const mounted = (page) => page.evaluate(() => !!document.querySelector("[data-entry-root]"));
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.jpg`, type: "jpeg", quality: 82 });
const bufShot = (page) => page.screenshot({ type: "png" });
// opacity + transform + clip of every [data-e] layer (the cloud shader drifts with wall-clock time, so pixels can't be compared)
const layers = (page) => page.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-entry-root] [data-e]")].map((el) => {
  const c = getComputedStyle(el); const r = (v) => v.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(2));
  return [el.dataset.e, `${(+c.opacity).toFixed(3)}|${r(c.transform)}|${c.clipPath}`];
})));
async function diff(a, b) {
  const [A, B] = await Promise.all([sharp(a).raw().toBuffer({ resolveWithObject: true }), sharp(b).raw().toBuffer({ resolveWithObject: true })]);
  let d = 0; for (let i = 0; i < A.data.length; i++) d += Math.abs(A.data[i] - B.data[i]);
  return d / A.data.length / 255;
}

// ── 1. journey screenshots + reverse + completion guard, per viewport ──────────────
for (const [tag, opts] of [["1440x900", DESKTOP], ["390x844", MOBILE]]) {
  {
    const { ctx, page, problems } = await open(opts);
    await ready(page);
    for (const p of [0, 0.3, 0.55, 0.72, 0.96]) {
      await goTo(page, p); if (p) await settle(page, p); else await page.waitForTimeout(400);
      await shot(page, `${tag}-p${String(Math.round(p * 100)).padStart(3, "0")}`);
    }
    check(`${tag}: still mounted at .96 (Entry never ends before the timeline does)`, await mounted(page));
    await goTo(page, 1);
    await page.waitForFunction(() => window.__rootGone, null, { timeout: 15000 });
    check(`${tag}: completes once the timeline reaches the end`, (await page.evaluate(() => window.__prog)) >= 0.985, `last tl.progress=${(await page.evaluate(() => window.__prog)).toFixed(3)}`);
    await page.waitForTimeout(1400);
    await shot(page, `${tag}-p100`);
    check(`${tag}: no hydration warnings`, problems.length === 0, problems[0]);
    await ctx.close();
  }
  {
    // reverse: .8 → .4 must unwind the same timeline, monotonic, and match a straight-to-.4 frame
    const { ctx, page } = await open(opts);
    await ready(page);
    await goTo(page, 0.4); await settle(page, 0.4); await page.waitForTimeout(200);
    const direct = await layers(page);
    await goTo(page, 0.8); await settle(page, 0.8);
    await page.evaluate(() => { window.__s = []; const t = () => { window.__s.push(window.__dtEntry.tl.progress()); window.__raf = requestAnimationFrame(t); }; t(); });
    await goTo(page, 0.4); await settle(page, 0.4); await page.waitForTimeout(200);
    const samples = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__s; });
    let monotonic = true; for (let i = 1; i < samples.length; i++) if (samples[i] > samples[i - 1] + 1e-6) monotonic = false;
    check(`${tag}: .8 → .4 reverses monotonically`, monotonic && samples.length > 10, `${samples.length} frames, ${samples[0].toFixed(3)} → ${samples.at(-1).toFixed(3)}`);
    check(`${tag}: Entry still mounted after reversing`, await mounted(page));
    const back = await layers(page);
    // numbers within tolerance (settle is ±.004 of progress): opacity ±.03, px ±6; "none" ≡ identity matrix
    const nums = (v) => v.replace(/\|none\|/, "|matrix(1, 0, 0, 1, 0, 0)|").match(/-?\d+(\.\d+)?/g).map(Number);
    const near = (a, b) => { const x = nums(a), y = nums(b); return x.length === y.length && x.every((n, i) => Math.abs(n - y[i]) <= (i === 0 ? 0.03 : 6)); };
    const bad = Object.keys(direct).filter((k) => !near(direct[k], back[k]));
    check(`${tag}: reversed .4 layer state (opacity/transform/clip) equals straight-to-.4`, bad.length === 0, bad.length ? bad.map((k) => `${k}: ${direct[k]} ≠ ${back[k]}`).join("; ") : `${Object.keys(direct).length} layers identical`);
    await shot(page, `${tag}-reverse-8-to-4`);
    await goTo(page, 1);
    await page.waitForFunction(() => window.__rootGone, null, { timeout: 15000 });
    check(`${tag}: still completes after a reverse`, true);
    await ctx.close();
  }
}

// ── 2. the ".86" bug: hard reload, cache off, throttled; fast scroll to the end ─────
{
  const { ctx, page, problems } = await open(DESKTOP, { throttle: true });
  await ready(page);
  await goTo(page, 0.86); await page.waitForTimeout(250);
  check("throttled: jump to .86 keeps the Entry mounted", await mounted(page), `tl.progress=${(await tlp(page))?.toFixed(3)}`);
  await settle(page, 0.86);
  await goTo(page, 1); // End key / scrollbar drag: scroll is at 1.0 while the scrub trails
  await page.waitForTimeout(150);
  check("throttled: scroll at 1.0 but timeline behind → Entry NOT ended", await mounted(page), `tl.progress=${(await tlp(page))?.toFixed(3)}`);
  await page.waitForFunction(() => window.__rootGone, null, { timeout: 15000 });
  check("throttled: ends only after tl.progress → 1", (await page.evaluate(() => window.__prog)) >= 0.985);
  check("throttled: no hydration warnings", problems.length === 0, problems[0]);
  await ctx.close();
}

// ── 3. refresh can't push the scroll past the end ────────────────────────────────
for (const [tag, opts, h2] of [["1440x900", DESKTOP, 640], ["390x844", MOBILE, 700]]) {
  const { ctx, page } = await open(opts);
  await ready(page);
  await goTo(page, 0.55); await settle(page, 0.55);
  await page.setViewportSize({ width: opts.viewport.width, height: h2 }); // track length changes → ScrollTrigger refresh
  await page.waitForTimeout(900);
  const y = await page.evaluate(() => scrollY / (document.documentElement.scrollHeight - innerHeight));
  check(`${tag}: viewport resize mid-journey holds progress (≈.55, not past the end)`, Math.abs(y - 0.55) < 0.02 && (await mounted(page)), `scroll progress ${y.toFixed(3)}, tl ${(await tlp(page))?.toFixed(3)}`);
  await page.evaluate(() => window.dispatchEvent(new Event("load")));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  check(`${tag}: font/load refresh leaves it mounted`, await mounted(page));
  await ctx.close();
}

// ── 4. reduced motion @ 390×844 ──────────────────────────────────────────────────
{
  const { ctx, page, problems } = await open(MOBILE, { reduced: true });
  await page.waitForSelector("[data-e=enter]", { timeout: 60000 });
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({
    track: !!document.querySelector("[data-entry-track]"), aerial: !!document.querySelector("[data-e=aerial]"),
    cue: !!document.querySelector("[data-e=cue]"), skip: !!document.querySelector("[data-e=skip]"), scrollable: document.documentElement.scrollHeight > innerHeight + 4,
  }));
  check("reduced motion: no scroll track, journey layers, cue or skip", !st.track && !st.aerial && !st.cue && !st.skip && !st.scrollable, JSON.stringify(st));
  await shot(page, "390x844-reduced-motion-before");
  await page.click("[data-e=enter]");
  await page.waitForFunction(() => !document.querySelector("[data-entry-root]"), null, { timeout: 8000 });
  check("reduced motion: Enter hands over to the Wall", true);
  check("reduced motion: marks the session as entered", (await page.evaluate(() => sessionStorage.getItem("dt_entered"))) === "1");
  await page.waitForTimeout(900);
  await shot(page, "390x844-reduced-motion-after");
  check("reduced motion: no hydration warnings", problems.length === 0, problems[0]);
  await ctx.close();
}

// ── 5. first paint (JS blocked = exactly what is on screen before hydration) ─────
for (const [tag, opts] of [["1440x900", DESKTOP], ["390x844", MOBILE]]) {
  const first = await open(opts, { blockJs: true });
  const f = await first.page.evaluate(() => {
    const vis = (el) => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden" && el.getBoundingClientRect().width > 0;
    return { html: document.documentElement.className, root: vis(document.querySelector("[data-entry-root]")), cue: vis(document.querySelector("[data-e=cue]")),
      word: vis(document.querySelector("[data-e=hero] img")), blackout: vis(document.querySelector("[class*=blackout]")) };
  });
  check(`${tag} first visit, pre-hydration: Entry frame shown, Wall blackout hidden`, f.root && f.cue && f.word && !f.blackout && !f.html.includes("dt-skip-entry"), JSON.stringify(f));
  await shot(first.page, `${tag}-firstpaint-first-visit`);
  await first.ctx.close();

  for (const [what, o] of [["returning", { entered: true }], ["fit deep link", { url: "/?fit=doodh-nahi" }]]) {
    const r = await open(opts, { ...o, blockJs: true });
    const g = await r.page.evaluate(() => {
      const root = document.querySelector("[data-entry-root]");
      return { skip: document.documentElement.classList.contains("dt-skip-entry"), rootDisplay: root && getComputedStyle(root).display };
    });
    check(`${tag} ${what}, pre-hydration: Entry hidden via dt-skip-entry`, g.skip && g.rootDisplay === "none", JSON.stringify(g));
    if (tag === "1440x900") await shot(r.page, `${tag}-firstpaint-${what.replace(" ", "-")}`);
    await r.ctx.close();
  }
  // and hydrated: returning visitors / deep links never see the Entry mount
  for (const [what, o] of [["returning", { entered: true }], ["fit deep link", { url: "/?fit=doodh-nahi" }]]) {
    const r = await open(opts, o);
    await r.page.waitForTimeout(2500);
    check(`${tag} ${what}: Entry gone after hydration, no hydration warnings`, !(await mounted(r.page)) && r.problems.length === 0, r.problems[0]);
    await r.ctx.close();
  }
}

// ── 6. Wall chrome is visible 2s after landing, whichever way in ───────────────────
// Header (logo, Bag), #tag, #foot and #hello must end at opacity 1 / visibility visible, inside the viewport.
// No inline or CSS state (entering / dt-skip-entry) may leave them hidden.
const CHROME = {
  logo: "header[data-nodrag] [class*=logo]", bag: "header[data-nodrag] a[href='/cart']",
  tag: "[class*=tag]:not([class*=tagline])", foot: "[class*=foot]", hello: "[class*=hello]",
};
async function chromeState(page) {
  return page.evaluate((sels) => {
    const out = {};
    for (const [k, sel] of Object.entries(sels)) {
      const el = document.querySelector(sel);
      if (!el) { out[k] = "missing"; continue; }
      // effective opacity = product along the ancestor chain; visibility is inherited by computed style
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const inView = r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      out[k] = op > 0.99 && cs.visibility === "visible" && cs.display !== "none" && inView ? "ok" : `op=${op.toFixed(2)} vis=${cs.visibility} inView=${inView}`;
    }
    return out;
  }, CHROME);
}
const opts_isMobile = (page) => page.viewportSize().width <= 820;
const backLabel = (page) => page.evaluate(() => document.querySelector("header[data-nodrag] nav button, header[data-nodrag] nav a")?.textContent?.trim());
// logo + Bag are the required pair; tag/foot/hello are only on the unzoomed wall
async function assertChrome(tag, what, page, { zoomed = false, wait = 2000 } = {}) {
  await page.waitForSelector("header[data-nodrag]", { state: "attached", timeout: 30000 }); // landing = the Wall's own header is mounted
  await page.waitForTimeout(wait);
  const c = await chromeState(page);
  const mob = opts_isMobile(page);
  // #tag / #foot are display:none under 820px by design (wall.module.css) → desktop only
  const need = zoomed ? ["logo", "bag"] : mob ? ["logo", "bag", "hello"] : ["logo", "bag", "tag", "foot", "hello"];
  const bad = need.filter((k) => c[k] !== "ok");
  check(`${tag} ${what}: header logo + Bag${zoomed ? "" : opts_isMobile(page) ? " + #hello" : " + #tag/#foot/#hello"} visible 2s after landing`, bad.length === 0, bad.map((k) => `${k}: ${c[k]}`).join("; "));
  const html = await page.evaluate(() => ({ cls: document.documentElement.className, entering: !!document.querySelector("[data-entering]"), inert: !!document.querySelector("[inert]") }));
  check(`${tag} ${what}: no lingering entering / inert state`, !html.entering && !html.inert, JSON.stringify(html));
}
const FIT = "ek-peg-aur";
for (const [tag, opts] of [["1440x900", DESKTOP], ["390x844", MOBILE]]) {
  { // 1. full scroll to the end
    const { ctx, page } = await open(opts); await ready(page);
    await goTo(page, 1); await page.waitForFunction(() => window.__rootGone, null, { timeout: 20000 });
    await assertChrome(tag, "full scroll", page); await shot(page, `${tag}-chrome-scroll`); await ctx.close();
  }
  { // 2. Walk in
    const { ctx, page } = await open(opts); await ready(page);
    await goTo(page, 0.8); await settle(page, 0.8);
    await page.evaluate(() => document.querySelector("[data-e=walk]").click());
    await page.waitForFunction(() => window.__rootGone, null, { timeout: 25000 });
    await assertChrome(tag, "Walk in", page); await shot(page, `${tag}-chrome-walkin`); await ctx.close();
  }
  { // 3. Skip to the wall
    const { ctx, page } = await open(opts); await ready(page);
    await page.evaluate(() => document.querySelector("[data-e=skip]").click());
    await page.waitForFunction(() => window.__rootGone || !document.querySelector("[data-entry-root]"), null, { timeout: 8000 });
    await assertChrome(tag, "Skip to the wall", page); await shot(page, `${tag}-chrome-skip`); await ctx.close();
  }
  { // 4. reduced-motion Enter button
    const { ctx, page } = await open(opts, { reduced: true });
    await page.waitForSelector("[data-e=enter]", { timeout: 60000 });
    await page.click("[data-e=enter]");
    await page.waitForFunction(() => !document.querySelector("[data-entry-root]"), null, { timeout: 8000 });
    await assertChrome(tag, "reduced-motion Enter", page); await ctx.close();
  }
  { // 5. returning visit, same session: dt-skip-entry + the Wall's own lights-on intro (≈2.0s long, so allow +0.6s)
    const { ctx, page } = await open(opts, { entered: true });
    await assertChrome(tag, "returning visit (lights-on)", page, { wait: 2600 });
    check(`${tag} returning visit: dt-skip-entry is on <html>`, await page.evaluate(() => document.documentElement.classList.contains("dt-skip-entry")));
    await shot(page, `${tag}-chrome-returning`);
    // …and once lights have been seen the Wall opens with no intro at all: chrome must still appear
    await page.reload({ waitUntil: "commit" });
    await assertChrome(tag, "returning visit (lights already seen)", page, { wait: 2600 });
    await ctx.close();
  }
  { // 6. /?fit= deep link, then ← Collection
    const { ctx, page } = await open(opts, { url: `/?fit=${FIT}` });
    await assertChrome(tag, "fit deep link", page, { zoomed: true });
    check(`${tag} fit deep link: zoomed header shows "← Collection"`, (await backLabel(page)) === "← Collection", String(await backLabel(page)));
    await shot(page, `${tag}-chrome-fit-zoomed`);
    await page.evaluate(() => document.querySelector("header[data-nodrag] nav button").click());
    // on a phone the wall scrolls to that fit's row on close, so the in-world #hello is legitimately off-screen: assert the fixed header only
    await assertChrome(tag, "fit deep link → ← Collection", page, { wait: 2200, zoomed: opts_isMobile(page) });
    check(`${tag} after ← Collection: back on the wall (header says Collection, url has no ?fit)`, /^Collection/.test(await backLabel(page) ?? "") && !page.url().includes("fit="), `${await backLabel(page)} ${page.url()}`);
    await shot(page, `${tag}-chrome-fit-closed`); await ctx.close();
  }
  { // 7. browser back from /product/[slug] to /
    const { ctx, page } = await open(opts, { entered: true });
    await page.waitForTimeout(500);
    await page.goto(`${BASE}/product/${FIT}`, { waitUntil: "load" });
    check(`${tag} product page: header shows "← Collection"`, (await backLabel(page)) === "← Collection", String(await backLabel(page)));
    await page.goBack({ waitUntil: "commit" });
    await page.waitForURL((u) => u.pathname === "/", { timeout: 10000 });
    await assertChrome(tag, "browser back from /product", page, { wait: 2600 });
    await shot(page, `${tag}-chrome-back`); await ctx.close();
  }
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

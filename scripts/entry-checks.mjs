// Entry + Wall checks (Playwright). Run against a running production server:
//   pnpm build && pnpm exec next start -p 3100 &   then   node scripts/entry-checks.mjs [baseURL]
// Screenshots → docs/reference/pour001/checks/.  Exits 1 on any failed assertion.
//
// The Entry never unmounts: "live" = the Wall has taken over (root[data-live], html.dt-live),
// "dormant" = the Entry is on top and the Wall is a backdrop.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { computeLayout } from "../components/theka/wall/wallLayout.ts";
import { computeDecor } from "../components/theka/wall/wallDecor.ts";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const OUT = new URL("../docs/reference/pour001/checks/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
// Wall dressing + Story room frames (sections 7–9)
const OUT2 = new URL("../docs/reference/story/checks/", import.meta.url).pathname;
mkdirSync(OUT2, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`); };
const HYDRATION = /hydrat|#418|#419|#422|#423|#425|did not match|mismatch/i;

const DESKTOP = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 };
const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const VIEWPORTS = [["1440x900", DESKTOP], ["390x844", MOBILE]];
const isMob = (page) => page.viewportSize().width <= 820;

// node scripts/entry-checks.mjs --only=4,5   runs just those numbered sections
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice(7).split(",").map(Number);
const on = (n) => !ONLY || ONLY.includes(n);
const browser = await chromium.launch();

async function open(opts, { entered = false, throttle = false, url = "/", reduced = false, blockJs = false, init = null, lights = false } = {}) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const problems = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type()) && HYDRATION.test(m.text())) problems.push(m.text()); });
  page.on("pageerror", (e) => { if (HYDRATION.test(String(e))) problems.push(String(e)); });
  await page.addInitScript((entered) => {
    try { sessionStorage.setItem("dt_entry_debug", "1"); if (entered) sessionStorage.setItem("dt_entered", "1"); } catch {}
    // A frame where the Entry's sky is on screen but the Entry isn't live (and wasn't asked to be hidden)
    // after a returning visit / deep link would be a flash of the sky before the Wall.
    window.__skyFlash = false;
    const tick = () => {
      const r = document.querySelector("[data-entry-root]");
      if (r && sessionStorage.getItem("dt_entered") === "1" || /[?&]fit/.test(location.search)) {
        if (r && getComputedStyle(r).display !== "none" && !r.hasAttribute("data-live")) window.__skyFlash = true;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, entered);
  if (lights) await page.addInitScript(() => { try { sessionStorage.setItem("dt-wall-lights", "1"); } catch {} });
  if (init) await page.addInitScript(init);
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
const goTo = (page, p) => page.evaluate((p) => scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)), p);
const settle = (page, p) => page.waitForFunction((p) => Math.abs(window.__dtEntry.tl.progress() - p) < 0.004, p, { timeout: 15000 });
const tlp = (page) => page.evaluate(() => window.__dtEntry?.tl.progress() ?? null);
const isLive = (page) => page.evaluate(() => document.documentElement.classList.contains("dt-live") && !!document.querySelector("[data-entry-root][data-live]"));
const waitLive = (page, on = true, timeout = 20000) => page.waitForFunction((on) => (document.documentElement.classList.contains("dt-live") && !!document.querySelector("[data-entry-root][data-live]")) === on, on, { timeout });
const mounted = (page) => page.evaluate(() => !!document.querySelector("[data-entry-root]") && !!document.querySelector("[data-entry-track]"));
const shot = (page, name) => page.screenshot({ path: `${OUT}${name}.jpg`, type: "jpeg", quality: 82 });

// the walk back out: desktop wheel (> 90px) / mobile pull-down (> 70px from scrollTop 0)
async function pullUp(page) {
  await page.waitForTimeout(1800); // the Wall ignores wheel input for 1.6s after it goes live (momentum guard)
  await page.evaluate(() => { const sc = document.querySelector("[data-wall-scroller]"); if (sc) sc.scrollTop = 0; }); // "at the top of the Wall"
  if (!isMob(page)) {
    await page.mouse.move(720, 450);
    for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, -60); await page.waitForTimeout(40); }
  } else {
    const cdp = await page.context().newCDPSession(page);
    const t = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: 195, y }] });
    await t("touchStart", 260);
    for (const y of [290, 320, 350, 380]) { await t("touchMove", y); await page.waitForTimeout(30); }
    await t("touchEnd", 380);
  }
}

// ── chrome visibility (logo, Bag, tag, foot, hello) ──────────────────────────────────────
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
      let op = 1; for (let e = el; e; e = e.parentElement) op *= +getComputedStyle(e).opacity;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const inView = r.width > 0 && r.height > 0 && r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1;
      out[k] = op > 0.99 && cs.visibility === "visible" && cs.display !== "none" && inView ? "ok" : `op=${op.toFixed(2)} vis=${cs.visibility} inView=${inView}`;
    }
    return out;
  }, CHROME);
}
const backLabel = (page) => page.evaluate(() => document.querySelector("header[data-nodrag] nav button, header[data-nodrag] nav a")?.textContent?.trim());
async function assertChrome(tag, what, page, { zoomed = false, wait = 2000 } = {}) {
  await page.waitForSelector("header[data-nodrag]", { state: "attached", timeout: 30000 });
  await page.waitForTimeout(wait);
  const c = await chromeState(page);
  const need = zoomed ? ["logo", "bag"] : isMob(page) ? ["logo", "bag", "hello"] : ["logo", "bag", "tag", "foot", "hello"];
  const bad = need.filter((k) => c[k] !== "ok");
  check(`${tag} ${what}: Wall chrome visible 2s after landing (${need.join(", ")})`, bad.length === 0, bad.map((k) => `${k}: ${c[k]}`).join("; "));
  const st = await page.evaluate(() => ({ entering: !!document.querySelector("[data-entering]"), inert: !!document.querySelector("[inert]") }));
  check(`${tag} ${what}: Wall not dormant (no data-entering / inert)`, !st.entering && !st.inert, JSON.stringify(st));
}

// the Wall's DOM helpers ------------------------------------------------------------------
const wallItems = (page) => page.evaluate(() => [...document.querySelectorAll("[data-wall-scroller] button[data-slug]")].map((b) => {
  const r = b.getBoundingClientRect(); const im = b.querySelector("[data-fit]");
  return { slug: b.dataset.slug, aria: b.getAttribute("aria-label"), x: r.left + r.width / 2, y: r.bottom, w: r.width, h: r.height, src: im?.getAttribute("src") };
}));
const openItem = (page, i) => page.evaluate((i) => document.querySelectorAll("[data-wall-scroller] button[data-slug]")[i].click(), i);
const panel = (page) => page.evaluate(() => {
  const root = document.querySelector("aside[class*=panel]");
  const sw = [...root.querySelectorAll("[role=radio]")];
  const pressed = [...root.querySelectorAll("[role=group] button")].map((b) => [b.textContent.trim(), b.getAttribute("aria-pressed")]);
  return {
    name: document.querySelector("section[class*=info] h1")?.textContent.trim(),
    cw: root.querySelector("[class*=row] span:first-child")?.textContent.trim(), price: root.querySelector("[class*=row] span:last-child")?.textContent.trim(),
    radiogroup: root.querySelector("[role=radiogroup]")?.getAttribute("role"),
    swatches: sw.map((s) => [s.getAttribute("aria-label"), s.getAttribute("aria-checked"), s.dataset.sw]), pressed,
    counter: [...document.querySelector("div[class*=count]").querySelectorAll("span")].map((s) => s.textContent.trim()).join(" / "),
  };
});
const fitSrcOf = (page, i) => page.evaluate((i) => document.querySelectorAll("[data-wall-scroller] button[data-slug]")[i].querySelector("[data-fit]").getAttribute("src"), i);
const cart = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("drip-theka-cart") || "{}").state?.items?.map((i) => ({ slug: i.product.slug, price: i.product.price, size: i.size, colour: i.colorName })) ?? []);

// ═════════════════════════════════════════════════════════════════════════════════════════
// 1. blue-shutter frames, the live handoff, hydration  (per viewport)
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(1)) {
for (const [tag, opts] of VIEWPORTS) {
  const { ctx, page, problems } = await open(opts);
  await ready(page);
  for (const p of [0, 0.3, 0.55, 0.62, 0.67, 0.72, 0.8, 0.88]) {
    await goTo(page, p); if (p) await settle(page, p); else await page.waitForTimeout(400);
    await page.waitForTimeout(250);
    await shot(page, `${tag}-p${String(Math.round(p * 100)).padStart(3, "0")}`);
  }
  check(`${tag}: not live at .88 (the Wall only takes over at the end)`, !(await isLive(page)), `tl ${(await tlp(page)).toFixed(3)}`);
  // blue flood: #blue is lit at .62, settled at .80
  await goTo(page, 0.62); await settle(page, 0.62);
  const blue62 = await page.evaluate(() => +getComputedStyle(document.querySelector("[data-e=blue]")).opacity);
  await goTo(page, 0.8); await settle(page, 0.8);
  const blue80 = await page.evaluate(() => +getComputedStyle(document.querySelector("[data-e=blue]")).opacity);
  check(`${tag}: cobalt glare floods at .62 and settles (#blue .62=${blue62.toFixed(2)} → .80=${blue80.toFixed(2)})`, blue62 > 0.6 && blue80 < blue62 && blue80 > 0 && blue80 <= 0.15);
  await goTo(page, 1);
  await waitLive(page);
  await page.waitForTimeout(1500);
  const live = await page.evaluate(() => {
    const root = document.querySelector("[data-entry-root]"), cs = getComputedStyle(root);
    const street = getComputedStyle(document.querySelector("[data-e=street]"));
    return { aria: root.getAttribute("aria-hidden"), pe: cs.pointerEvents, street: street.visibility, track: !!document.querySelector("[data-entry-track]"), y: scrollY, max: document.documentElement.scrollHeight - innerHeight };
  });
  check(`${tag}: live handoff — Entry still mounted with its track, aria-hidden, pointer-events none, street hidden`, live.aria === "true" && live.pe === "none" && live.street === "hidden" && live.track, JSON.stringify(live));
  check(`${tag}: live handoff — page scroll parked at the end`, Math.abs(live.y - live.max) < 2, `${live.y}/${live.max}`);
  await assertChrome(tag, "walked in (full scroll)", page, { wait: 600 });
  await shot(page, `${tag}-live`);
  check(`${tag}: no hydration warnings`, problems.length === 0, problems[0]);
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 2. the journey is reversible: scroll up at the top of the Wall, 3 times (wheel / pull-down)
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(2)) {
for (const [tag, opts] of VIEWPORTS) {
  const { ctx, page, problems } = await open(opts);
  await ready(page);
  await goTo(page, 1); await waitLive(page); await page.waitForTimeout(1200);
  for (let n = 1; n <= 3; n++) {
    await pullUp(page);
    await waitLive(page, false, 6000);
    await page.waitForFunction(() => window.__dtEntry.tl.progress() < 0.9, null, { timeout: 8000 });
    await page.waitForTimeout(1600); // the 1.2s tween + the scrub catching up
    const dormant = await page.evaluate(() => ({ inert: !!document.querySelector("[inert]"), p: window.__dtEntry.tl.progress(), y: scrollY, max: document.documentElement.scrollHeight - innerHeight, vh: innerHeight, headerVis: getComputedStyle(document.querySelector("header[data-nodrag]")).visibility }));
    const want = (dormant.max - dormant.vh * 1.4) / dormant.max;
    check(`${tag} exit #${n}: Wall dormant (inert, chrome hidden), scroll at maxScroll − 1.4·vh`, dormant.inert && dormant.headerVis === "hidden" && Math.abs(dormant.y / dormant.max - want) < 0.01, `progress ${dormant.p.toFixed(3)} want ${want.toFixed(3)} header ${dormant.headerVis}`);
    if (n === 1) await shot(page, `${tag}-exit-up-settled`);
    // normal scrolling plays the journey in reverse: out under the shutter, the street, the lane, the clouds
    for (const [p, what] of [[0.7, "street"], [0.45, "lane"], [0, "clouds"]]) {
      await goTo(page, p); await settle(page, p); await page.waitForTimeout(200);
      if (n === 1) await shot(page, `${tag}-reverse-${what}`);
    }
    const sky = await page.evaluate(() => ({ hero: +getComputedStyle(document.querySelector("[data-e=hero]")).opacity, st: getComputedStyle(document.querySelector("[data-e=street]")).visibility }));
    check(`${tag} exit #${n}: scrolled back to the clouds (hero visible)`, sky.hero > 0.6, JSON.stringify(sky));
    // …and back in again
    await goTo(page, 1); await waitLive(page, true, 20000); await page.waitForTimeout(900);
    await assertChrome(tag, `walked back in #${n}`, page, { wait: 500 });
  }
  check(`${tag}: no hydration warnings across 3 round trips`, problems.length === 0, problems[0]);
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 3. the Wall: 7 tees, layout, every tee opens, swatches, Back/Front, add to bag, price
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(3)) {
const NAMES = ["Its Done Bro", "Bad Influence", "Richer Than My Teacher", "Absolutly Sober", "No Smoking", "Janwar", "Aap Zara?"];
const SLUGS = [
  ["its-done-bro-ink", "its-done-bro-bone"], ["bad-influence-ink-cobalt", "bad-influence-ink-pink"], ["richer-than-my-teacher-ink", "richer-than-my-teacher-cocoa"],
  ["absolutly-sober-ink", "absolutly-sober-bone"], ["no-smoking-bone-red", "no-smoking-ink-red"], ["janwar-bone", "janwar-ink"], ["aap-zara-bone", "aap-zara-ink"],
];
for (const [tag, opts] of VIEWPORTS) {
  const { ctx, page, problems } = await open(opts, { entered: true });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]");
  await waitLive(page);
  await page.waitForTimeout(2800); // lights-on
  const items = await wallItems(page);
  check(`${tag}: the Wall shows 7 tees, back print first`, items.length === 7 && items.every((it, i) => it.slug === SLUGS[i][0] && /\/b0\d_/.test(it.src)), items.map((i) => i.slug).join(","));
  check(`${tag}: every tee reads ₹1,299`, items.every((it) => it.aria.includes("₹1,299")), items[0].aria);
  if (!isMob(page)) {
    const ys = [...new Set(items.map((i) => Math.round(i.y)))];
    const row2 = items.slice(4);
    check(`${tag}: desktop rows of 4 then 3, short row centred`, ys.length === 2 && items.slice(0, 4).every((i) => Math.round(i.y) === ys[0]) && Math.abs(row2[1].x - 720) < 2 && Math.abs((row2[0].x + row2[2].x) / 2 - 720) < 2, `ledges ${ys}`);
    await shot(page, `${tag}-wall-7`);
  } else {
    const rows = {}; items.forEach((i) => { (rows[Math.round(i.y)] ??= []).push(i); });
    const rs = Object.values(rows);
    check(`${tag}: mobile 2 per row, last row stays LEFT (the Pour #002 teaser takes the free slot)`, rs.length === 4 && rs.slice(0, 3).every((r) => r.length === 2) && rs[3].length === 1 && Math.abs(rs[3][0].x - rs[2][0].x) < 2, rs.map((r) => r.length).join("+"));
    await shot(page, `${tag}-wall-7`);
  }
  await page.waitForTimeout(100);

  // header + tag
  const head = await page.evaluate(() => ({ coll: document.querySelector("header[data-nodrag] nav button")?.textContent.trim(), tag: [...document.querySelectorAll("[class*=tag] *")].map((e) => e.textContent.trim()).join("|") }));
  check(`${tag}: header "Collection7"${isMob(page) ? "" : ' · tag "7 fits · 400 GSM"'}`, head.coll === "Collection7" && (isMob(page) || /7 fits · 400 GSM/i.test(head.tag)), JSON.stringify(head));

  // open each tee in turn
  for (let i = 0; i < 7; i++) {
    if (i === 0) await openItem(page, 0);
    else if (!isMob(page)) { await page.keyboard.press("ArrowRight"); } else { await page.keyboard.press("ArrowRight"); }
    await page.waitForTimeout(i === 0 ? 2100 : 1700);
    const p = await panel(page);
    check(`${tag} tee ${i + 1}/7 ${NAMES[i]}: info, ₹1,299, 2 swatches (radiogroup), Back selected, counter 0${i + 1} / 07`,
      p.name?.toLowerCase() === NAMES[i].toLowerCase() && p.price === "₹1,299" && p.swatches.length === 2 && p.radiogroup === "radiogroup" && p.swatches[0][1] === "true" && p.swatches[1][1] === "false"
        && p.pressed[0][0] === "Back" && p.pressed[0][1] === "true" && p.pressed[1][1] === "false" && p.counter === `0${i + 1} / 07`, JSON.stringify(p));
    if (i === 0) await shot(page, `${tag}-product-view`);
    // flip Back → Front → Back
    const before = await fitSrcOf(page, i);
    await page.click("[role=group] button:has-text('Front')");
    await page.waitForTimeout(800);
    const front = await fitSrcOf(page, i);
    await page.click("[role=group] button:has-text('Back')");
    await page.waitForTimeout(800);
    const back = await fitSrcOf(page, i);
    check(`${tag} tee ${i + 1}: Back/Front flip swaps the art (${before.split("/").pop()} → ${front.split("/").pop()} → ${back.split("/").pop()})`, /\/f_/.test(front) && back === before);
    // switch colourway → crossfade, label, the image
    await page.click(`[role=radio][data-sw="${SLUGS[i][1]}"]`);
    await page.waitForTimeout(900);
    const p2 = await panel(page);
    const art2 = await fitSrcOf(page, i);
    check(`${tag} tee ${i + 1}: swatch 2 → label "${p2.cw}", aria-checked moves, art switches, URL ?fit=colourway`,
      p2.swatches[1][1] === "true" && p2.swatches[0][1] === "false" && art2 !== before && page.url().includes(`fit=${SLUGS[i][1]}`), `${before.split("/").pop()} → ${art2.split("/").pop()} ${page.url()}`);
    // add to bag with a size → cart line carries the colourway slug and 129900
    await page.selectOption("aside[class*=panel] select", "M");
    await page.click("aside[class*=panel] button[aria-label='Add to bag']");
    await page.waitForTimeout(300);
  }
  const lines = await cart(page);
  check(`${tag}: cart has 7 lines with each tee's 2nd-colourway slug and ₹1,299 (129900)`, lines.length === 7 && lines.every((l, i) => l.slug === SLUGS[i][1] && l.price === 129900 && l.size === "M"), JSON.stringify(lines.map((l) => l.slug + ":" + l.price)));
  // the colourway stays chosen per design while you move along the aisle
  await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(1700);
  const kept = await panel(page);
  check(`${tag}: colourway stays chosen per design along the aisle; Back is the default after moving`, kept.swatches[1][1] === "true" && kept.pressed[0][1] === "true", JSON.stringify(kept.swatches));
  // Front is reset to Back when moving to another design
  await page.click("[role=group] button:has-text('Front')"); await page.waitForTimeout(700);
  await page.keyboard.press("ArrowLeft"); await page.waitForTimeout(1700);
  const reset = await panel(page);
  check(`${tag}: moving to another design resets Front → Back`, reset.pressed[0][1] === "true" && reset.pressed[1][1] === "false", JSON.stringify(reset.pressed));
  check(`${tag}: no hydration warnings on the Wall`, problems.length === 0, problems[0]);
  // the cart page shows ₹1,299 lines (its own persisted-cart hydration is outside this change; not asserted here)
  await page.goto(BASE + "/cart", { waitUntil: "load" });
  await page.waitForTimeout(1200);
  const cartText = await page.evaluate(() => document.body.innerText);
  check(`${tag}: /cart shows ₹1,299 for the tees`, /1,299/.test(cartText), (cartText.match(/₹\s?[\d,]+/g) ?? []).slice(0, 6).join(" "));
  if (tag === "1440x900") {
    // /api/reserve accepts every colourway slug (test mode: no DB → stub reservation)
    const body = (slug) => ({ email: "check@example.com", name: "Check Run", phone: "9876543210", address: { line1: "1 Test Lane", city: "Delhi", state: "Delhi", pincode: "110001" }, items: [{ slug, size: "M", qty: 1 }] });
    const bad = [];
    for (const s of SLUGS.flat()) {
      const r = await page.request.post(`${BASE}/api/reserve`, { data: body(s) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok() || !j.reservationId || j.depositPaise !== Math.round(129900 * 0.3)) bad.push(`${s}: ${r.status()} ${JSON.stringify(j)}`);
    }
    check("/api/reserve accepts all 14 colourway slugs (deposit = 30% of ₹1,299)", bad.length === 0, bad[0]);
    const r404 = await page.request.post(`${BASE}/api/reserve`, { data: body("no-smoking") }); // a design slug is not a product
    check("/api/reserve rejects an unknown slug (400)", r404.status() === 400);
  }
  // product page: price, JSON-LD
  await page.goto(`${BASE}/product/no-smoking-ink-red`, { waitUntil: "load" });
  await page.waitForTimeout(800);
  const pp = await page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, text: document.body.innerText.includes("₹1,299"), ld: JSON.parse(document.querySelector("script[type='application/ld+json']").textContent), sw: [...document.querySelectorAll("[role=radio]")].map((s) => s.getAttribute("aria-checked")) }));
  check(`${tag}: /product/no-smoking-ink-red — ₹1,299, JSON-LD price 1299.00, Ink / Red chosen`, pp.text && pp.ld.offers.price === "1299.00" && pp.ld.color === "Ink / Red" && pp.sw.join() === "false,true", JSON.stringify({ h1: pp.h1, price: pp.ld.offers.price, sw: pp.sw }));
  await shot(page, `${tag}-product-page`);
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 4. deep links and returning visitors start at the end, already live — and can still scroll up
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(4)) {
for (const [tag, opts] of VIEWPORTS) {
  {
    const { ctx, page, problems } = await open(opts, { url: "/?fit=no-smoking-ink-red" });
    await page.waitForSelector("[data-wall-scroller] button[data-slug]");
    await waitLive(page); await page.waitForTimeout(1500);
    const p = await panel(page);
    check(`${tag}: /?fit=no-smoking-ink-red opens zoomed on No Smoking with Ink / Red selected`, p.name?.toLowerCase() === "no smoking" && p.cw === "Ink / Red" && p.swatches[1][1] === "true" && (await backLabel(page)) === "← Collection", JSON.stringify(p));
    await assertChrome(tag, "fit deep link", page, { zoomed: true, wait: 200 });
    await shot(page, `${tag}-deeplink-no-smoking-ink-red`);
    check(`${tag}: deep link — the sky never flashed before the Wall`, !(await page.evaluate(() => window.__skyFlash)));
    check(`${tag}: deep link — no hydration warnings`, problems.length === 0, problems[0]);
    // a design slug picks the first colourway
    await page.goto(BASE + "/?fit=no-smoking", { waitUntil: "load" });
    await waitLive(page); await page.waitForTimeout(1500);
    check(`${tag}: /?fit=no-smoking (design slug) opens Bone / Red`, (await panel(page)).cw === "Bone / Red");
    // ← Collection, then up reaches the sky
    await page.evaluate(() => document.querySelector("header[data-nodrag] nav button").click());
    await page.waitForTimeout(2000);
    await pullUp(page);
    await waitLive(page, false, 6000);
    await page.waitForTimeout(1600); await goTo(page, 0); await settle(page, 0); await page.waitForTimeout(400);
    check(`${tag}: from a deep link, scrolling up still reaches the sky`, (await page.evaluate(() => +getComputedStyle(document.querySelector("[data-e=hero]")).opacity)) > 0.9);
    await shot(page, `${tag}-deeplink-then-sky`);
    await ctx.close();
  }
  {
    const { ctx, page, problems } = await open(opts, { entered: true });
    await page.waitForSelector("[data-wall-scroller] button[data-slug]");
    await waitLive(page);
    await assertChrome(tag, "returning visit (lights-on)", page, { wait: 2600 });
    check(`${tag}: returning — starts live at the end; the sky never flashed`, (await isLive(page)) && !(await page.evaluate(() => window.__skyFlash)) && (await page.evaluate(() => window.__dtEntry.tl.progress())) >= 0.999);
    check(`${tag}: returning — no hydration warnings`, problems.length === 0, problems[0]);
    await shot(page, `${tag}-returning`);
    await pullUp(page); await waitLive(page, false, 6000); await page.waitForTimeout(1600);
    await goTo(page, 0); await settle(page, 0); await page.waitForTimeout(400);
    check(`${tag}: returning — scrolling up reaches the sky`, (await page.evaluate(() => +getComputedStyle(document.querySelector("[data-e=hero]")).opacity)) > 0.9);
    // a scrollbar drag away from the end: dormant below .985, live again at the end
    await goTo(page, 1); await waitLive(page); await page.waitForTimeout(800);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight - innerHeight - 500));
    await waitLive(page, false, 8000);
    check(`${tag}: scrubbing back below .985 (a scrollbar drag) puts the Wall dormant again`, !(await isLive(page)) && !!(await page.evaluate(() => document.querySelector("[inert]"))));
    await ctx.close();
  }
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 5. the other ways in; skip / walk in; reduced motion; first paint
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(5)) {
for (const [tag, opts] of VIEWPORTS) {
  { // Skip to the wall
    const { ctx, page } = await open(opts); await ready(page);
    await page.evaluate(() => document.querySelector("[data-e=skip]").click());
    await waitLive(page, true, 8000);
    await assertChrome(tag, "Skip to the wall", page);
    await ctx.close();
  }
  { // Walk in
    const { ctx, page } = await open(opts); await ready(page);
    await goTo(page, 0.8); await settle(page, 0.8);
    await page.evaluate(() => document.querySelector("[data-e=walk]").click());
    await waitLive(page, true, 25000);
    await assertChrome(tag, "Walk in", page);
    await ctx.close();
  }
}
{ // reduced motion @ 390×844 and 1440×900: no scroll journey; Enter → the Wall; swatches swap instantly
  for (const [tag, opts] of VIEWPORTS) {
    const { ctx, page, problems } = await open(opts, { reduced: true });
    await page.waitForSelector("[data-e=enter]", { timeout: 60000 });
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => ({ track: !!document.querySelector("[data-entry-track]"), aerial: !!document.querySelector("[data-e=aerial]"), cue: !!document.querySelector("[data-e=cue]"), skip: !!document.querySelector("[data-e=skip]"), scrollable: document.documentElement.scrollHeight > innerHeight + 4 }));
    check(`${tag} reduced motion: no scroll journey (no track, layers, cue, skip)`, !st.track && !st.aerial && !st.cue && !st.skip && !st.scrollable, JSON.stringify(st));
    if (tag === "390x844") await shot(page, `${tag}-reduced-motion-before`);
    await page.click("[data-e=enter]");
    await page.waitForFunction(() => document.querySelector("[data-entry-root]")?.hasAttribute("data-live"), null, { timeout: 8000 });
    await page.waitForFunction(() => sessionStorage.getItem("dt_entered") === "1", null, { timeout: 5000 }).catch(() => {});
    check(`${tag} reduced motion: Enter goes to the Wall (session marked entered)`, (await page.evaluate(() => sessionStorage.getItem("dt_entered"))) === "1");
    await assertChrome(tag, "reduced-motion Enter", page);
    await openItem(page, 4); await page.waitForTimeout(400);
    await page.click(`[role=radio][data-sw="no-smoking-ink-red"]`);
    await page.waitForTimeout(120);
    const src = await fitSrcOf(page, 4);
    check(`${tag} reduced motion: swatches swap instantly (<120ms)`, /b05_ink/.test(src), src);
    check(`${tag} reduced motion: no hydration warnings`, problems.length === 0, problems[0]);
    await ctx.close();
  }
}
// first paint (JS blocked = exactly what is on screen before hydration)
for (const [tag, opts] of VIEWPORTS) {
  const first = await open(opts, { blockJs: true });
  const f = await first.page.evaluate(() => {
    const vis = (el) => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden" && el.getBoundingClientRect().width > 0;
    return { html: document.documentElement.className, root: vis(document.querySelector("[data-entry-root]")), cue: vis(document.querySelector("[data-e=cue]")), word: vis(document.querySelector("[data-e=hero] img")), blackout: vis(document.querySelector("[class*=blackout]")) };
  });
  check(`${tag} first visit, pre-hydration: Entry frame shown, Wall blackout hidden`, f.root && f.cue && f.word && !f.blackout && !f.html.includes("dt-skip-entry"), JSON.stringify(f));
  await shot(first.page, `${tag}-firstpaint-first-visit`);
  await first.ctx.close();
  for (const [what, o] of [["returning", { entered: true }], ["fit deep link", { url: "/?fit=no-smoking-ink-red" }]]) {
    const r = await open(opts, { ...o, blockJs: true });
    const g = await r.page.evaluate(() => ({ skip: document.documentElement.classList.contains("dt-skip-entry"), rootDisplay: getComputedStyle(document.querySelector("[data-entry-root]")).display }));
    check(`${tag} ${what}, pre-hydration: first frame is the Wall (Entry hidden via dt-skip-entry)`, g.skip && g.rootDisplay === "none", JSON.stringify(g));
    if (tag === "1440x900") await shot(r.page, `${tag}-firstpaint-${what.replace(" ", "-")}`);
    await r.ctx.close();
  }
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 6. robustness: throttled fast scroll to the end, refresh mid-journey
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(6)) {
{
  const { ctx, page, problems } = await open(DESKTOP, { throttle: true });
  await ready(page);
  await goTo(page, 0.86); await page.waitForTimeout(250);
  check("throttled: jump to .86 keeps the Entry on top (not live)", !(await isLive(page)), `tl.progress=${(await tlp(page))?.toFixed(3)}`);
  await settle(page, 0.86);
  await goTo(page, 1); // End key / scrollbar drag: scroll is at 1.0 while the scrub trails
  await page.waitForTimeout(150);
  check("throttled: scroll at 1.0 but timeline behind → NOT live yet", !(await isLive(page)), `tl.progress=${(await tlp(page))?.toFixed(3)}`);
  await waitLive(page);
  check("throttled: goes live only after tl.progress ≥ .999", (await tlp(page)) >= 0.999);
  check("throttled: no hydration warnings", problems.length === 0, problems[0]);
  await ctx.close();
}
for (const [tag, opts, h2] of [["1440x900", DESKTOP, 640], ["390x844", MOBILE, 700]]) {
  const { ctx, page } = await open(opts);
  await ready(page);
  await goTo(page, 0.55); await settle(page, 0.55);
  await page.setViewportSize({ width: opts.viewport.width, height: h2 }); // track length changes → ScrollTrigger refresh
  await page.waitForTimeout(900);
  const y = await page.evaluate(() => scrollY / (document.documentElement.scrollHeight - innerHeight));
  check(`${tag}: viewport resize mid-journey holds progress (≈.55, not past the end)`, Math.abs(y - 0.55) < 0.02 && !(await isLive(page)), `scroll progress ${y.toFixed(3)}, tl ${(await tlp(page))?.toFixed(3)}`);
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 7. the Wall's dressing: neon, lamps + cones, rate list, enamel sign, Pour #002 teaser
// ═════════════════════════════════════════════════════════════════════════════════════════
const shot2 = (page, name, opts = {}) => page.screenshot({ path: `${OUT2}${name}.jpg`, type: "jpeg", quality: 82, ...opts });
const NEON_REC = () => {
  window.__neon = [];
  const go = () => {
    const el = document.querySelector('[data-decor="neon"]');
    if (!el) { requestAnimationFrame(go); return; }
    window.__neon.push({ t: performance.now(), v: el.dataset.on });
    // MutationObserver batches: rebuild every intermediate value from the records' old values
    new MutationObserver((recs) => {
      const t = performance.now();
      recs.slice(1).forEach((r) => window.__neon.push({ t, v: r.attributeOldValue }));
      window.__neon.push({ t, v: el.dataset.on });
    }).observe(el, { attributes: true, attributeFilter: ["data-on"], attributeOldValue: true });
  };
  go();
};
const collapse = (vals) => vals.filter((v) => v === "true" || v === "false").filter((v, i, a) => i === 0 || v !== a[i - 1]);
const neonLog = (page) => page.evaluate(() => window.__neon);
const DRESS_SIZES = [["1440x900", DESKTOP], ["1280x720", { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }], ["390x844", MOBILE]];
const rectOf = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
const near = (a, b, eps = 1.5) => Math.abs(a - b) <= eps;

if (on(7)) {
for (const [tag, opts] of DRESS_SIZES) {
  const mob = opts.viewport.width <= 820;
  const { vw, vh } = { vw: opts.viewport.width, vh: opts.viewport.height };
  const { ctx, page, problems } = await open(opts, { entered: true, lights: true, init: NEON_REC });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]");
  await waitLive(page);
  await page.waitForTimeout(2500);

  // positions = computeDecor(), measured on screen
  const L = computeLayout(vw, vh, 7), D = computeDecor(L, vw, vh);
  const scrollTop = 0;
  const at = async (sel) => { const r = await rectOf(page, sel); return r && { ...r, y: r.y + scrollTop }; };
  const neon = await at('[data-decor="neon"]');
  check(`${tag}: neon wordmark at ${mob ? "top 182, w min(.62vw, 300)" : "50vw / .20vh, w min(.22vw, .40vh)"}`,
    neon && near(neon.x + neon.w / 2, D.neon.cx) && near(neon.y + neon.h / 2, D.neon.cy) && near(neon.w, D.neon.w), JSON.stringify(neon));
  const rate = await at('[data-decor="rate"]');
  check(`${tag}: rate list at (${Math.round(D.rate.left)}, ${Math.round(D.rate.top)}) w ${Math.round(D.rate.width)}`, rate && near(rate.x + rate.w / 2, D.rate.left + D.rate.width / 2, 6) && near(rate.y + rate.h / 2, D.rate.top + rate.h / 2, 8), JSON.stringify(rate));
  const teaser = await at('[data-decor="teaser"]');
  check(`${tag}: Pour #002 teaser takes ${mob ? "the free slot (last row, col 2)" : "row 2's right outer slot"}`, teaser && D.teaser && near(teaser.x, D.teaser.left) && near(teaser.y, D.teaser.top) && near(teaser.w, D.teaser.width) && near(teaser.h, D.teaser.height), JSON.stringify(teaser));
  const enamel = await at('[data-decor="enamel"]');
  check(`${tag}: enamel sign in place`, enamel && near(enamel.x + enamel.w / 2, D.enamel.left + (D.enamel.width ?? enamel.w) / 2, 6), JSON.stringify(enamel));
  const text = await page.evaluate(() => ({
    rate: document.querySelector('[data-decor="rate"]').innerText.replace(/\s+/g, " "),
    enamel: document.querySelector('[data-decor="enamel"]').innerText.replace(/\s+/g, " "),
    lamps: document.querySelectorAll("[data-lamp]").length, cones: document.querySelectorAll("[data-cone]").length,
    ff: getComputedStyle(document.querySelector('[data-decor="rate"]')).fontFamily,
  }));
  check(`${tag}: rate list reads the real price / GSM / deposit`, /RATE LIST · रेट लिस्ट/.test(text.rate) && /Any fit ₹1,299/.test(text.rate) && /Fabric 400 GSM/.test(text.rate) && /Fit oversized/.test(text.rate) && /Reserve 30% now/.test(text.rate), text.rate);
  check(`${tag}: rate list is set in Kalam`, /kalam/i.test(text.ff), text.ff);
  check(`${tag}: enamel sign reads आज नकद, कल उधार / CASH TODAY · CREDIT TOMORROW`, /आज नकद, कल उधार/.test(text.enamel) && /CASH TODAY · CREDIT TOMORROW/.test(text.enamel), text.enamel);
  check(`${tag}: one lamp + one light cone per fit (7 + 7)`, text.lamps === 7 && text.cones === 7, JSON.stringify(text));
  const lamps = await page.evaluate(() => [...document.querySelectorAll("[data-lamp]")].map((e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top]; }));
  check(`${tag}: lamps at the reference positions`, lamps.every(([x, y], i) => near(x, D.lamps[i].x) && near(y, D.lamps[i].top)), JSON.stringify(lamps.slice(0, 2)));

  // the neon: off while dormant, flicked on after live
  const log = await neonLog(page);
  check(`${tag}: neon is on (glow) after the Wall is live`, (await page.evaluate(() => document.querySelector('[data-decor="neon"]').dataset.on)) === "true" && /drop-shadow/.test(await page.evaluate(() => getComputedStyle(document.querySelector('[data-decor="neon"] img')).filter)));
  check(`${tag}: neon flicks on (returning-visitor landing: on·off·on(·off·on) — a hydration-jank frame can swallow the first 60ms)`, collapse(log.map((l) => l.v)).join(",").includes("true,false,true"), collapse(log.map((l) => l.v)).join(","));
  await shot2(page, `wall-dressing-${tag}`);

  if (!mob) {
    // hover a fit → its cone turns cobalt, the ledge glows
    const items = await wallItems(page);
    await page.mouse.move(items[1].x, items[1].y - items[1].h / 2);
    await page.waitForTimeout(900);
    const cones = await page.evaluate(() => [...document.querySelectorAll("[data-cone]")].map((c) => ({ on: c.dataset.on, bg: getComputedStyle(c).backgroundImage.includes("150, 185, 255"), op: +getComputedStyle(c).opacity })));
    check(`${tag}: hovering a fit turns ITS cone cobalt at full strength (others stay warm)`, cones[1].on === "true" && cones[1].bg && cones[1].op === 1 && cones.filter((_, i) => i !== 1).every((c) => c.on === "false" && !c.bg && c.op === 0.5), JSON.stringify(cones.map((c) => c.on)));
    await shot2(page, `wall-hover-cone-${tag}`);
    await page.mouse.move(5, vh - 5);
  }

  // the teaser: a toast with a Regulars link, never the product view
  await page.click('[data-decor="teaser"]');
  await page.waitForTimeout(700);
  const toast = await page.evaluate(() => { const t = document.querySelector('[role="status"]'); const a = t.querySelector("a"); return { text: t.innerText.replace(/\s+/g, " "), vis: getComputedStyle(t).visibility, href: a?.getAttribute("href"), aVis: a && getComputedStyle(a).display }; });
  check(`${tag}: teaser click → toast "Pour #002 is brewing. Regulars hear first." with a /regulars action`, toast.vis === "visible" && /Pour #002 is brewing\. Regulars hear first\./.test(toast.text) && toast.href === "/regulars" && toast.aVis !== "none", JSON.stringify(toast));
  const nav = await backLabel(page);
  check(`${tag}: teaser did not open the product view (header still "Collection7", no ?fit=)`, /^Collection/.test(nav ?? "") && !/fit=/.test(page.url()), `${nav} ${page.url()}`);
  await page.waitForTimeout(3800);

  // zoomed product view: framing intact; dressing doesn't cover the info / buy panels (mobile: it fades out)
  await openItem(page, 2);
  await page.waitForTimeout(2300);
  const zoom = await page.evaluate(() => {
    const vis = (e) => { const cs = getComputedStyle(e); let op = 1; for (let x = e; x; x = x.parentElement) op *= +getComputedStyle(x).opacity; return op > 0.05 && cs.display !== "none"; };
    const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
    const panels = [document.querySelector("aside[class*=panel]"), document.querySelector("section[class*=info]")].map(R);
    const deco = [...document.querySelectorAll("[data-decor], [data-lamp], [data-cone]")].filter(vis).map((e) => ({ k: e.dataset.decor ?? (e.dataset.lamp != null ? "lamp" : "cone"), r: R(e) }));
    const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    return { visible: deco.map((d) => d.k), over: deco.filter((d) => d.k !== "cone" && panels.some((p) => hit(d.r, p))).map((d) => d.k) };
  });
  if (mob) check(`${tag}: zoomed on mobile — dressing, lamps and cones fade out with the other tees`, zoom.visible.length === 0, zoom.visible.join(","));
  else check(`${tag}: zoomed — no dressing piece (neon / sign / board / teaser / lamp) overlaps the info or buy panels`, zoom.over.length === 0, zoom.over.join(","));
  await shot2(page, `wall-zoomed-${tag}`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1900);
  if (mob) {
    const back = await page.evaluate(() => [...document.querySelectorAll("[data-decor]")].every((e) => +getComputedStyle(e).opacity > 0.95 || getComputedStyle(e).display === "none"));
    check(`${tag}: closing the product view brings the dressing back`, back);
  }
  check(`${tag}: no hydration warnings`, problems.length === 0, problems[0]);
  await ctx.close();
}

// neon: flicks on as you duck in under the shutter (Entry → Wall handoff); off when the Wall goes dormant; tired-tube blink; reduced motion
{
  const { ctx, page } = await open(DESKTOP, { init: NEON_REC });
  await ready(page);
  const pre = await page.evaluate(() => document.querySelector('[data-decor="neon"]').dataset.on);
  check("neon: off while the Entry is on top", pre === "false");
  await goTo(page, 1); await waitLive(page);
  const tLive = await page.evaluate(() => performance.now());
  await page.waitForTimeout(1500);
  const log = await neonLog(page);
  const after = collapse(log.filter((l) => l.t > tLive - 400).map((l) => l.v)).join(",");
  const first = log.find((l) => l.t > tLive - 400 && l.v === "true");
  check("neon: flicks on ~250ms after the Wall goes live (handoff)", after.includes("true,false,true,false,true") && first && first.t - tLive < 900, `${after} +${first ? Math.round(first.t - tLive) : "?"}ms`);
  await pullUp(page);
  await waitLive(page, false, 6000);
  await page.waitForFunction(() => window.__dtEntry.tl.progress() < 0.9, null, { timeout: 8000 });
  await page.waitForTimeout(1600);
  check("neon: off again when the Wall goes dormant (walked back out)", (await page.evaluate(() => document.querySelector('[data-decor="neon"]').dataset.on)) === "false");
  await goTo(page, 0.7); await settle(page, 0.7);
  await goTo(page, 1); await waitLive(page, true, 20000); await page.waitForTimeout(1500);
  check("neon: flicks on again when you walk back in", (await page.evaluate(() => document.querySelector('[data-decor="neon"]').dataset.on)) === "true");
  // tired tube: off for ~70ms every 9s while on
  const n0 = (await neonLog(page)).length;
  await page.waitForTimeout(9500);
  const l2 = (await neonLog(page)).slice(n0);
  check("neon: a 'tired tube' blink (off ≈70ms) every 9s while on", l2.some((l, i) => l.v === "false" && l2[i + 1]?.v === "true" && l2[i + 1].t - l.t < 160), l2.map((l) => `${l.v}@${Math.round(l.t)}`).join(" "));
  await ctx.close();
}
{
  const { ctx, page } = await open(DESKTOP, { entered: true, reduced: true, init: NEON_REC });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]"); await waitLive(page); await page.waitForTimeout(1500);
  const log = await neonLog(page);
  check("neon: reduced motion → simply on, no flicker", collapse(log.map((l) => l.v)).join(",") === "false,true", collapse(log.map((l) => l.v)).join(","));
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 8. the Story room (/story): the walk, mobile, reduced motion, resize
// ═════════════════════════════════════════════════════════════════════════════════════════
const walkInfo = (page) => page.evaluate(() => {
  const strip = document.querySelector("[data-panel='p0']").parentElement;
  const dist = strip.scrollWidth - innerWidth;
  const panels = Object.fromEntries([...document.querySelectorAll("[data-panel]")].map((p) => [p.dataset.panel, p.offsetLeft + p.offsetWidth / 2 - innerWidth / 2]));
  return { dist, panels, max: document.documentElement.scrollHeight - innerHeight };
});
const stringsOff = (page) => page.evaluate(() => {
  const svg = document.querySelector("[data-strings]"), r = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const pins = [...document.querySelectorAll("[data-pin]")].map((p) => { const b = p.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; });
  const ends = [...svg.querySelectorAll("path")].map((p) => {
    const m = p.getAttribute("d").match(/M([-\d.]+),([-\d.]+) Q[-\d.]+,[-\d.]+ ([-\d.]+),([-\d.]+)/);
    const map = (x, y) => [r.left + (x * r.width) / vb.width, r.top + (y * r.height) / vb.height];
    return [map(+m[1], +m[2]), map(+m[3], +m[4])];
  });
  return ends.map(([a, b], i) => Math.max(Math.hypot(a[0] - pins[i][0], a[1] - pins[i][1]), Math.hypot(b[0] - pins[i + 1][0], b[1] - pins[i + 1][1])));
});

if (on(8)) {
{
  const errs = [];
  const { ctx, page } = await open(DESKTOP, { url: "/story", init: () => {
    window.__neonCls = [];
    const go = () => { const el = document.querySelector("[data-story-neon]"); if (!el) { requestAnimationFrame(go); return; }
      window.__neonCls.push({ t: performance.now(), off: el.dataset.lit !== "true" });
      new MutationObserver((recs) => { const t = performance.now();
        recs.slice(1).forEach((r) => window.__neonCls.push({ t, off: r.attributeOldValue !== "true" }));
        window.__neonCls.push({ t, off: el.dataset.lit !== "true" }); }).observe(el, { attributes: true, attributeFilter: ["data-lit"], attributeOldValue: true }); };
    go();
  } });
  page.on("pageerror", (e) => errs.push(String(e)));
  await page.waitForSelector("[data-panel='p8']");
  await page.waitForTimeout(1500);
  const meta = await page.evaluate(() => ({ title: document.title, desc: document.querySelector('meta[name="description"]')?.content, h1: document.querySelector("h1")?.textContent }));
  check("/story: title \"Our story — Drip Theka\" + a description", meta.title === "Our story — Drip Theka" && (meta.desc?.length ?? 0) > 40, JSON.stringify(meta));
  const hdr = await page.evaluate(() => [...document.querySelectorAll("header nav a")].map((a) => a.textContent.trim() + "→" + a.getAttribute("href")));
  check("/story: own header — logo, The Wall · Our Story · Try the Look, Bag; no site chrome", hdr.join("|") === "The Wall→/|Our Story→/story|Try the Look→/try-the-look" && !(await page.$("footer")) && !(await page.$("[class*=theka-cursor]")), hdr.join("|"));
  const w = await walkInfo(page);
  check("/story: ScrollTrigger pins the wall (pin-spacer) and the walk is scrollWidth − vw long", !!(await page.$(".pin-spacer")) && Math.abs(w.max - w.dist) < 3, `dist ${Math.round(w.dist)} max ${w.max}`);
  // frames at walk progress 0 / .22 / .48 / .72 / 1
  for (const p of [0, 0.22, 0.48, 0.72, 1]) {
    await page.evaluate((y) => scrollTo(0, y), p * w.max); await page.waitForTimeout(2200);
    await shot2(page, `story-p${String(Math.round(p * 100)).padStart(3, "0")}`);
  }
  const prog = await page.evaluate(() => document.querySelector("[data-progress]").style.width);
  check("/story: progress line fills (100% at the end)", parseFloat(prog) > 99, prog);
  // every lamp turns on as its object reaches the middle
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
  const lamp = [];
  for (const [id, x] of Object.entries(w.panels)) {
    const y = Math.max(0, Math.min(w.max, x));
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(1700);
    const st = await page.evaluate((id) => {
      const p = document.querySelector(`[data-panel='${id}']`), pool = p.querySelector("[data-pool]");
      const rv = [...p.querySelectorAll("[data-rv]")].map((e) => +getComputedStyle(e).opacity);
      return { pool: pool ? +getComputedStyle(pool).opacity : null, rv: Math.min(...rv, 1), video: id === "p7" ? !document.querySelector("video").paused : null,
        neonOff: id === "p4" ? document.querySelector("[data-story-neon]").dataset.lit !== "true" : null };
    }, id);
    lamp.push([id, st.pool]);
    check(`/story ${id}: lamp pool on (${st.pool?.toFixed(2)}) and objects risen (min opacity ${st.rv.toFixed(2)}) at the middle`, st.pool > 0.95 && st.rv > 0.95, JSON.stringify(st));
    if (id === "p4") check("/story p4: neon ठेका is lit while its panel is active", st.neonOff === false);
    if (id === "p7") check("/story p7: the TV plays while its panel is active", st.video === true);
    if (id === "p3") {
      const off = await stringsOff(page);
      check(`/story p3: the strings meet the pins (max ${Math.max(...off).toFixed(1)}px off)`, Math.max(...off) < 3, off.map((o) => o.toFixed(1)).join(","));
      await shot2(page, "story-strings");
    }
  }
  check("/story: the TV is paused away from its panel", await page.evaluate(() => document.querySelector("video").paused));
  const cls = await page.evaluate(() => window.__neonCls);
  const flips = cls.slice(1).filter((c, i) => c.off !== cls[i].off).length;
  check(`/story: the neon flickers on (≥ 4 toggles while its panel became active; saw ${flips})`, flips >= 4);
  // resize mid-walk keeps working
  await page.evaluate((y) => scrollTo(0, y), w.panels.p2); await page.waitForTimeout(1500);
  await page.setViewportSize({ width: 1180, height: 760 });
  await page.waitForTimeout(1200);
  const w2 = await walkInfo(page);
  check("/story: resize mid-walk re-measures the walk (new distance, still pinned)", Math.abs(w2.dist - w.dist) > 100 && Math.abs(w2.max - w2.dist) < 3 && !!(await page.$(".pin-spacer")), `${Math.round(w.dist)} → ${Math.round(w2.dist)}`);
  await page.evaluate((y) => scrollTo(0, y), w2.panels.p3); await page.waitForTimeout(1800);
  const off2 = await stringsOff(page);
  check(`/story: …and the strings still meet the pins after the resize (max ${Math.max(...off2).toFixed(1)}px)`, Math.max(...off2) < 3, off2.map((o) => o.toFixed(1)).join(","));
  const x1 = await page.evaluate(() => { const b = document.querySelector("[data-panel='p3']").getBoundingClientRect(); return b.left + b.width / 2; });
  check("/story: …and the scrub still lands the panel in the middle", Math.abs(x1 - 590) < 40, `${Math.round(x1)} vs 590`);
  check("/story: no page errors", errs.length === 0, errs[0]);
  await ctx.close();
}
// mobile: a vertical wall
{
  const { ctx, page } = await open(MOBILE, { url: "/story" });
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.waitForSelector("[data-panel='p8']"); await page.waitForTimeout(1200);
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, bw: document.body.scrollWidth, iw: innerWidth, spacer: !!document.querySelector(".pin-spacer"),
    panels: [...document.querySelectorAll("[data-panel]")].map((p) => Math.round(p.getBoundingClientRect().height)), nav: getComputedStyle(document.querySelector("header nav")).display, strings: getComputedStyle(document.querySelector("[data-strings]")).display }));
  check("/story mobile 390×844: no horizontal scroll, no pin, panels ≥ 92svh stacked", m.sw <= m.iw && m.bw <= m.iw && !m.spacer && m.panels.every((h) => h >= 0.92 * 844 - 2), JSON.stringify(m));
  // scroll down slowly (reveals, neon, TV), then capture
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  let sawNeon = false, sawVideo = false;
  for (let y = 0; y < total; y += 300) {
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(260);
    const st = await page.evaluate(() => ({ neon: document.querySelector("[data-story-neon]").dataset.lit === "true", video: !document.querySelector("video").paused,
      r4: document.querySelector("[data-panel='p4']").getBoundingClientRect(), r7: document.querySelector("[data-panel='p7']").getBoundingClientRect() }));
    if (st.r4.top < 844 * 0.4 && st.r4.bottom > 844 * 0.6) sawNeon ||= st.neon;
    if (st.r7.top < 844 * 0.3 && st.r7.bottom > 844 * 0.7) sawVideo ||= st.video;
  }
  check("/story mobile: the neon lights and the TV plays while their panels are on screen", sawNeon && sawVideo, `neon ${sawNeon} tv ${sawVideo}`);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(600);
  await shot2(page, "story-mobile-top");
  await page.screenshot({ path: `${OUT2}story-mobile-full.jpg`, type: "jpeg", quality: 70, fullPage: true });
  const fin = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  check("/story mobile: still no horizontal scroll after the full read", fin.sw <= fin.iw, JSON.stringify(fin));
  check("/story mobile: no page errors", errs.length === 0, errs[0]);
  await ctx.close();
}
// reduced motion: the static vertical wall, at desktop width
{
  const { ctx, page } = await open(DESKTOP, { url: "/story", reduced: true });
  await page.waitForSelector("[data-panel='p8']"); await page.waitForTimeout(1200);
  const r = await page.evaluate(() => ({
    spacer: !!document.querySelector(".pin-spacer"), strip: getComputedStyle(document.querySelector("[data-panel='p0']").parentElement).flexDirection,
    neonOff: document.querySelector("[data-story-neon]").dataset.lit !== "true", neonColor: getComputedStyle(document.querySelector("[data-story-neon]")).color,
    rv: Math.min(...[...document.querySelectorAll("[data-rv]")].map((e) => +getComputedStyle(e).opacity)), pools: Math.min(...[...document.querySelectorAll("[data-pool]")].map((e) => +getComputedStyle(e).opacity)),
    sw: document.documentElement.scrollWidth, iw: innerWidth, video: document.querySelector("video").paused,
  }));
  check("/story reduced motion @1440: vertical stack, no pin", !r.spacer && r.strip === "column", JSON.stringify(r));
  check("/story reduced motion: neon simply on, reveals static (opacity 1), lamps lit, TV not auto-playing", r.neonColor === "rgb(219, 230, 255)" && r.rv === 1 && r.pools === 1 && r.video, JSON.stringify(r));
  await page.evaluate(() => scrollTo(0, 3000)); await page.waitForTimeout(500);
  await shot2(page, "story-reduced-motion");
  check("/story reduced motion: no horizontal scroll", r.sw <= r.iw);
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 9. getting there and back: the momentum guard, scroll down → /story, Back to the wall
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(9)) {
{
  // fresh visit, desktop: wheel hard through the end of the Entry and into the Wall
  const { ctx, page } = await open(DESKTOP, { init: NEON_REC });
  await ready(page);
  await goTo(page, 0.97); await settle(page, 0.97).catch(() => {});
  await page.mouse.move(720, 450);
  const t0 = Date.now(); let liveAt = 0;
  for (let i = 0; i < 70; i++) { // ~2.8s of "momentum": 120px every 40ms, well over 260px in total after the Wall is live
    await page.mouse.wheel(0, 120); await page.waitForTimeout(40);
    if (!liveAt && (await isLive(page))) liveAt = Date.now();
  }
  check("momentum guard: the wheel streamed past the Entry's end and the Wall went live", !!liveAt, `live after ${liveAt ? liveAt - t0 : "never"}ms`);
  await page.waitForTimeout(900);
  const stay = new URL(page.url()).pathname;
  check("momentum guard: hard scroll into the Wall stays on the Wall (still /, no fade)", stay === "/" && (await isLive(page)) && (await page.evaluate(() => +getComputedStyle(document.querySelector("[class*=leave]")).opacity)) < 0.05, stay);
  // the guard window needs 1.6s of quiet; then a fresh scroll down leads to the story
  await page.waitForTimeout(2200);
  const link0 = await page.evaluate(() => document.querySelector("[class*=storyLink]").getBoundingClientRect().top);
  for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(30); if (i === 1) await page.waitForTimeout(100); }
  const link1 = await page.evaluate(() => document.querySelector("[class*=storyLink]").getBoundingClientRect().top);
  await page.waitForURL("**/story", { timeout: 6000 }).catch(() => {});
  check("a fresh scroll down (> 260px) on the live Wall goes to /story", new URL(page.url()).pathname === "/story", page.url());
  check("the \"Our story ↓\" link nudged up as you scrolled", link1 < link0 - 4, `${link0.toFixed(1)} → ${link1.toFixed(1)}`);
  // Back to the wall: lands live (session flag), neon flicks on, can still scroll up to the sky
  await page.waitForSelector("[data-panel='p8']"); await page.waitForTimeout(800);
  await page.evaluate(() => scrollTo(0, 1e6)); await page.waitForTimeout(2200);
  await page.click("a:has-text('Back to the wall')");
  await page.waitForURL((u) => u.pathname === "/", { timeout: 8000 });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]");
  await waitLive(page, true, 20000);
  await page.waitForTimeout(2200);
  const lg = await page.evaluate(() => window.__neon ?? []);
  await assertChrome("back-to-wall", "after the story", page, { wait: 200 });
  check("Back to the wall: lands live on / (no Entry replay) with the neon on", (await isLive(page)) && (await page.evaluate(() => document.querySelector('[data-decor="neon"]').dataset.on)) === "true", String(lg.length));
  await shot2(page, "back-to-wall-live");
  await pullUp(page);
  await waitLive(page, false, 6000);
  await page.waitForFunction(() => window.__dtEntry.tl.progress() < 0.9, null, { timeout: 8000 });
  await page.waitForTimeout(1600); // the 1.2s tween + the scrub catching up
  for (const p of [0.7, 0.45, 0]) { await goTo(page, p); await settle(page, p); await page.waitForTimeout(200); }
  const sky = await page.evaluate(() => +getComputedStyle(document.querySelector("[data-e=hero]")).opacity);
  check("…and scrolling up from the Wall still reaches the sky", sky > 0.6, `hero ${sky}`);
  await ctx.close();
}
// header "Our Story" + the link (and, on mobile, only those — no gesture)
for (const [tag, opts] of [["1440x900", DESKTOP], ["390x844", MOBILE]]) {
  const { ctx, page } = await open(opts, { entered: true, lights: true });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]"); await waitLive(page); await page.waitForTimeout(2200);
  if (!isMob(page)) {
    await page.click("header[data-nodrag] a:has-text('Our Story')");
    await page.waitForURL("**/story", { timeout: 6000 });
    check(`${tag}: header "Our Story" → /story (faded, then pushed)`, true);
  } else {
    // a long swipe/scroll on mobile must NOT leave the Wall
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Input.synthesizeScrollGesture", { x: 195, y: 600, yDistance: -500, speed: 1500 });
    await page.waitForTimeout(1800);
    check(`${tag}: mobile — scrolling the Wall never leaves it (no gesture)`, new URL(page.url()).pathname === "/");
    // the fixed link is hidden on phones; the in-flow row (under the enamel sign) is the way there
    check(`${tag}: mobile — the fixed "Our story ↓" is hidden`, await page.evaluate(() => getComputedStyle(document.querySelector("[class*=storyWrap]")).display === "none"));
    await page.evaluate(() => { const sc = document.querySelector("[data-wall-scroller]"); sc.scrollTop = sc.scrollHeight; });
    await page.waitForTimeout(400);
    await page.click("[data-decor=story]");
    await page.waitForURL("**/story", { timeout: 6000 });
    check(`${tag}: mobile — the in-flow "Our story ↓" row goes to /story`, true);
  }
  await ctx.close();
}
}

// ═════════════════════════════════════════════════════════════════════════════════════════
// 10. performance: the Wall's imagery is held while the Entry plays; mobile decor / header
// ═════════════════════════════════════════════════════════════════════════════════════════
if (on(10)) {
const HELD = /\/theka\/wall\/(pour001\/|wall\.webp)|logo_neon/;
const NOIDLE = () => { window.requestIdleCallback = () => 0; window.cancelIdleCallback = () => {}; }; // isolate the timeline path from idle-after-LCP
const wallImgs = (page) => page.evaluate(() => [...document.querySelectorAll("[data-wall-scroller] img")].map((i) => ({ src: i.getAttribute("src"), kind: i.hasAttribute("data-fit") ? "fit" : i.hasAttribute("data-sh") ? "sh" : "neon" })));
const bgLoaded = (page) => page.evaluate(() => getComputedStyle(document.querySelector("[class*=app] > [class*=bg]")).backgroundImage.includes("wall.webp"));
const kalamLoaded = (page) => page.evaluate(() => [...document.fonts].some((f) => /kalam/i.test(f.family) && f.status === "loaded"));
{
  // fresh visit, desktop: nothing of the Wall downloads until the timeline passes 1.2s / 3.8s
  const { ctx, page } = await open(DESKTOP, { init: NOIDLE });
  const reqs = []; page.on("request", (r) => { if (HELD.test(r.url())) reqs.push({ url: r.url(), t: Date.now() }); });
  await ready(page); await page.waitForTimeout(800);
  const imgs0 = await wallImgs(page);
  check("perf: while the Entry plays, none of the Wall's <img> has a src (7 tees + 7 shadows + neon)", imgs0.length === 15 && imgs0.every((i) => i.src === null), JSON.stringify(imgs0.filter((i) => i.src).slice(0, 2)));
  check("perf: …and no tee / shadow / neon / plaster request has gone out", reqs.length === 0, reqs.map((r) => r.url).join(","));
  const boxes0 = await wallItems(page);
  check("perf: …the held tees keep their boxes (layout reserved, so no shift)", boxes0.length === 7 && boxes0.every((b) => b.w > 50 && b.h > 50), JSON.stringify(boxes0[0]));
  check("perf: …the plaster and Kalam are held too", !(await bgLoaded(page)) && !(await kalamLoaded(page)));
  await goTo(page, 0.08); await settle(page, 0.08);          // ≈ 0.8s: still before the aerial
  check("perf: timeline 0.8s (< 1.2s): still held", (await wallImgs(page)).every((i) => i.src === null) && reqs.length === 0);
  await goTo(page, 0.15); await settle(page, 0.15);          // ≈ 1.5s: the aerial
  await page.waitForTimeout(1200);
  const imgs1 = await wallImgs(page);
  const fits = imgs1.filter((i) => i.kind === "fit"), shs = imgs1.filter((i) => i.kind === "sh");
  check("perf: timeline 1.5s (> 1.2s): the current colourway's backs (7) + shadows (7) have a src", fits.length === 7 && fits.every((i) => /\/b0\d_/.test(i.src)) && shs.length === 7 && shs.every((i) => i.src), JSON.stringify(imgs1.slice(0, 2)));
  check("perf: …the neon is still held, and no front / other-colourway request went out", imgs1.find((i) => i.kind === "neon").src === null && !reqs.some((r) => /logo_neon|\/f_/.test(r.url)), reqs.map((r) => r.url.split("/").pop()).join(","));
  check("perf: …the plaster is still held (it opens with the street, not the aerial)", !(await bgLoaded(page)));
  await goTo(page, 0.42); await settle(page, 0.42);          // ≈ 4.3s: the street
  await page.waitForTimeout(1200);
  check("perf: timeline 4.3s (> 3.8s): the neon loads", (await wallImgs(page)).find((i) => i.kind === "neon").src === "/brand/logo_neon.png" && reqs.some((r) => /logo_neon/.test(r.url)));
  check("perf: …and Kalam (the rate board) and the plaster with it", (await kalamLoaded(page)) && (await bgLoaded(page)));
  const fronts = reqs.filter((r) => /\/f_/.test(r.url));
  check("perf: …fronts and other colourways are still not requested during the Entry", fronts.length === 0, fronts.map((r) => r.url).join(","));
  await goTo(page, 1); await waitLive(page); await page.waitForTimeout(500);
  const sizeAfter = await wallItems(page);
  check("perf: going live keeps the tee boxes put (CLS ≈ 0)", sizeAfter.every((b, i) => Math.abs(b.w - boxes0[i].w) < 1 && Math.abs(b.h - boxes0[i].h) < 1 && Math.abs(b.y - boxes0[i].y) < 1));
  await ctx.close();
}
{
  // idle after LCP opens the art without any scrolling; the hard cap is 4s
  const { ctx, page } = await open(DESKTOP);
  await ready(page);
  await page.waitForFunction(() => [...document.querySelectorAll("[data-fit]")].every((i) => i.getAttribute("src")), null, { timeout: 8000 });
  check("perf: on idle after LCP the Wall's backs load even if the visitor never scrolls", (await tlp(page)) < 0.01, `tl ${(await tlp(page))?.toFixed(3)}`);
  await ctx.close();
}
{
  // returning visitor / deep link: everything immediately, no flash of held imagery
  for (const [what, url, entered] of [["returning visitor", "/", true], ["?fit= deep link", "/?fit=its-done-bro-ink", false]]) {
    const { ctx, page } = await open(DESKTOP, { url, entered });
    await page.waitForSelector("[data-wall-scroller] button[data-slug]"); await waitLive(page);
    const t = await wallImgs(page);
    // (a zoomed deep link leaves the off-screen tees (index ≥ 4) to the existing IntersectionObserver lazy-load, as before)
    const missing = t.filter((i) => !i.src);
    check(`perf: ${what} — nothing is held back: every Wall image (incl. the neon) has its src at once${url === "/" ? "" : " (bar the off-screen lazy tees)"}`, t.length === 15 && t.find((i) => i.kind === "neon").src && (url === "/" ? missing.length === 0 : missing.length <= 6 && t[1].src && t[2].src), JSON.stringify(missing));
    check(`perf: ${what} — plaster and Kalam load`, (await bgLoaded(page)) && (await page.waitForFunction(() => [...document.fonts].some((f) => /kalam/i.test(f.family) && f.status === "loaded"), null, { timeout: 6000 }).then(() => true, () => false)));
    await ctx.close();
  }
}
{
  // live: fronts / other colourways wait for a product view (or idle); opening a view warms them
  const { ctx, page } = await open(DESKTOP, { entered: true, init: NOIDLE });
  const reqs = []; page.on("request", (r) => { if (/\/theka\/wall\/pour001\//.test(r.url())) reqs.push(r.url()); });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]"); await waitLive(page); await page.waitForTimeout(1500);
  const n0 = reqs.length;
  check("perf: live, no idle yet — only the current backs + shadows are fetched (≤ 14)", n0 <= 14 && !reqs.some((u) => /\/f_/.test(u)), `${n0} requests`);
  await openItem(page, 0); await page.waitForTimeout(1500);
  check("perf: opening a product view warms the fronts + other colourways", reqs.length > n0, `${n0} → ${reqs.length}`);
  await ctx.close();
}
for (const [tag, vw, vh] of [["390x844", 390, 844], ["375x812", 375, 812]]) {
  const opts = { viewport: { width: vw, height: vh }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const { ctx, page, problems } = await open(opts, { entered: true, lights: true });
  await page.waitForSelector("[data-wall-scroller] button[data-slug]"); await waitLive(page); await page.waitForTimeout(2500);
  const rects = (sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((e) => { const r = e.getBoundingClientRect(), sc = document.querySelector("[data-wall-scroller]").scrollTop; return { x: r.left, y: r.top + sc, w: r.width, h: r.height, stem: parseFloat(getComputedStyle(e).getPropertyValue("--stem")) }; }), sel);
  const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const lamps = await rects("[data-lamp]"), neonR = (await rects("[data-decor=neon]"))[0], tees = await rects("[data-wall-scroller] button[data-slug]");
  check(`${tag}: every lamp hangs on a 24px cord (row 1 included — no 400px ceiling cord)`, lamps.length === 7 && lamps.every((l) => l.stem === 24), lamps.map((l) => l.stem).join(","));
  const bad = lamps.slice(0, 2).filter((l) => { const cord = { x: l.x + l.w / 2 - 1, y: l.y - l.stem, w: 2, h: l.stem }; return hit(cord, neonR) || hit(l, neonR); });
  check(`${tag}: no row-1 lamp body or cord touches the neon`, bad.length === 0, JSON.stringify({ neonR, lamps: lamps.slice(0, 2) }));
  check(`${tag}: no lamp overlaps a tee`, lamps.every((l) => tees.every((t) => !hit(l, t))));
  await shot2(page, `wall-mobile-top-${tag}`);
  // header: Collection · Our Story · Bag, no overlaps, Try the Look desktop-only
  const hd = await page.evaluate(() => {
    const R = (e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, vis: getComputedStyle(e).display !== "none" }; };
    const h = document.querySelector("header[data-nodrag]");
    const items = { logo: h.querySelector("[class*=logo]"), collection: h.querySelector("nav button"), story: h.querySelector("nav a[href='/story']"), look: h.querySelector("nav a[href='/try-the-look']"), bag: h.querySelector("a[href='/cart']") };
    return Object.fromEntries(Object.entries(items).map(([k, e]) => [k, e && R(e)]));
  });
  check(`${tag}: header shows "Our Story" next to Collection; "Try the Look" is desktop-only`, hd.story?.vis && hd.story.w > 0 && hd.look && !hd.look.vis, JSON.stringify({ story: hd.story, look: hd.look }));
  const seq = ["logo", "collection", "story", "bag"].map((k) => hd[k]);
  check(`${tag}: header items don't overlap each other and fit inside ${vw}px`, seq.every((a, i) => i === 0 || seq[i - 1].x + seq[i - 1].w <= a.x + 0.5) && seq[3].x + seq[3].w <= vw, seq.map((r) => `${Math.round(r.x)}–${Math.round(r.x + r.w)}`).join(" "));
  // the story row: in the scroll flow under the enamel sign
  await page.evaluate(() => { const sc = document.querySelector("[data-wall-scroller]"); sc.scrollTop = sc.scrollHeight; });
  await page.waitForTimeout(500);
  const row = (await rects("[data-decor=story]"))[0], enamel = (await rects("[data-decor=enamel]"))[0];
  const rowVis = await page.evaluate(() => { const r = document.querySelector("[data-decor=story]").getBoundingClientRect(); return { top: r.top, bottom: r.bottom, vh: innerHeight, scrollH: document.querySelector("[data-wall-scroller]").scrollHeight, scrollMax: document.querySelector("[data-wall-scroller]").scrollTop }; });
  check(`${tag}: "Our story ↓" is in the scroll flow, under the enamel sign, fully on screen at the end of the Wall`, row.y >= enamel.y + enamel.h - 1 && rowVis.top >= 0 && rowVis.bottom <= rowVis.vh, JSON.stringify({ row, enamel, rowVis }));
  check(`${tag}: …it's a ≥ 44px tap target and the fixed version is hidden`, row.h >= 44 && (await page.evaluate(() => getComputedStyle(document.querySelector("[class*=storyWrap]")).display === "none")), `h ${row.h}`);
  const txt = await page.evaluate(() => document.querySelector("[data-decor=story]").innerText.replace(/\s+/g, " "));
  check(`${tag}: …it reads "Our story ↓" with a short line`, /Our story ↓/i.test(txt) && txt.length > 14, txt);
  await shot2(page, `wall-mobile-bottom-${tag}`);
  // nothing overlaps at the bottom either
  const rest = await page.evaluate(() => [...document.querySelectorAll("[data-decor=rate],[data-decor=enamel],[data-decor=story],[data-decor=teaser]")].map((e) => { const r = e.getBoundingClientRect(); return { k: e.dataset.decor, x: r.left, y: r.top, w: r.width, h: r.height }; }));
  const clash = [];
  rest.forEach((a, i) => rest.slice(i + 1).forEach((b) => { if (hit(a, b)) clash.push(`${a.k}×${b.k}`); }));
  check(`${tag}: rate list, enamel sign, teaser and story row don't overlap`, clash.length === 0, clash.join(","));
  check(`${tag}: no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check(`${tag}: no hydration warnings`, problems.length === 0, problems[0]);
  await ctx.close();
}
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

// Entry + Wall checks (Playwright). Run against a running production server:
//   pnpm build && pnpm exec next start -p 3100 &   then   node scripts/entry-checks.mjs [baseURL]
// Screenshots → docs/reference/pour001/checks/.  Exits 1 on any failed assertion.
//
// The Entry never unmounts: "live" = the Wall has taken over (root[data-live], html.dt-live),
// "dormant" = the Entry is on top and the Wall is a backdrop.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100";
const OUT = new URL("../docs/reference/pour001/checks/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

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

async function open(opts, { entered = false, throttle = false, url = "/", reduced = false, blockJs = false } = {}) {
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
    check(`${tag}: mobile 2 per row, last row centred`, rs.length === 4 && rs.slice(0, 3).every((r) => r.length === 2) && rs[3].length === 1 && Math.abs(rs[3][0].x - 195) < 2, rs.map((r) => r.length).join("+"));
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

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);

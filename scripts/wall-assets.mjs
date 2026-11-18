#!/usr/bin/env node
// wall-assets — turn transparent product cutouts into wall-ready assets.
//
//   pnpm wall:assets                    process every assets-src/wall/<slug>/
//   pnpm wall:assets first-round-tee    process only the named slug(s)
//   pnpm wall:assets --mirror-back      no back.png? mirror front.png horizontally
//
// Input   assets-src/wall/<slug>/front.png  (+ back.png)   transparent cutouts
// Output  public/theka/wall/<slug>-front.webp      trimmed, 1100px tall, q88
//         public/theka/wall/<slug>-front_sh.webp   shadow: alpha ×50%, blur σ9, ×0.55, rgb(20,14,12), q80
//         …and the same for -back
//
// See docs/WALL_ASSETS.md for the full workflow.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "assets-src", "wall");
const OUT = path.join(ROOT, "public", "theka", "wall");

const HEIGHT = 1100;          // output height of the cutout
const ALPHA_EDGE = 20;        // alpha above this counts as "object" when trimming
const SHADOW_SCALE = 0.5;     // shadow is built at half size (the wall blurs/stretches it)
const SHADOW_SIGMA = 9;
const SHADOW_OPACITY = 0.55;
const SHADOW_RGB = [20, 14, 12];
const Q_IMAGE = 88;
const Q_SHADOW = 80;
const AR_MIN = 0.7;
const AR_MAX = 1.0;
const AR_WALL = 0.84;         // the Wall's default box

const args = process.argv.slice(2);
const mirrorBack = args.includes("--mirror-back");
const only = args.filter((a) => !a.startsWith("--"));

const kb = (n) => `${(n / 1024).toFixed(0)}KB`;

/** Bounding box of pixels with alpha > ALPHA_EDGE, or null if the image is empty. */
async function alphaBox(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      if (data[row + x] > ALPHA_EDGE) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}

/** Trim → 1100px tall RGBA PNG buffer (lossless intermediate, so the WebP is encoded once). */
async function cutout(file, { mirror = false } = {}) {
  let img = sharp(file).ensureAlpha();
  const box = await alphaBox(await img.png().toBuffer());
  if (!box) throw new Error(`${path.relative(ROOT, file)} has no opaque pixels (alpha > ${ALPHA_EDGE}) — is the background really transparent?`);
  img = sharp(file).ensureAlpha().extract(box);
  if (mirror) img = img.flop();
  const png = await img.resize({ height: HEIGHT, kernel: "lanczos3" }).png().toBuffer();
  return { png, trimmed: box };
}

/** Soft contact shadow from the cutout's own silhouette. */
async function shadow(png) {
  const meta = await sharp(png).metadata();
  const w = Math.max(1, Math.floor(meta.width * SHADOW_SCALE));
  const h = Math.max(1, Math.floor(meta.height * SHADOW_SCALE));
  const { data } = await sharp(png)
    .extractChannel(3)
    .resize(w, h, { kernel: "lanczos3" })
    .blur(SHADOW_SIGMA)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = SHADOW_RGB[0];
    rgba[i * 4 + 1] = SHADOW_RGB[1];
    rgba[i * 4 + 2] = SHADOW_RGB[2];
    rgba[i * 4 + 3] = Math.round(data[i] * SHADOW_OPACITY);
  }
  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .webp({ quality: Q_SHADOW })
    .toBuffer({ resolveWithObject: true });
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function findInput(dir, name) {
  for (const ext of ["png", "webp"]) {
    const p = path.join(dir, `${name}.${ext}`);
    if (await exists(p)) return p;
  }
  return null;
}

async function processSide(slug, side, file, { mirror }) {
  const { png, trimmed } = await cutout(file, { mirror });
  const main = await sharp(png).webp({ quality: Q_IMAGE }).toBuffer({ resolveWithObject: true });
  const sh = await shadow(png);
  const mainPath = path.join(OUT, `${slug}-${side}.webp`);
  const shPath = path.join(OUT, `${slug}-${side}_sh.webp`);
  await fs.writeFile(mainPath, main.data);
  await fs.writeFile(shPath, sh.data);
  return {
    slug, side,
    src: `${trimmed.width}×${trimmed.height}`,
    out: `${main.info.width}×${main.info.height} ${kb(main.data.length)}`,
    shadow: `${sh.info.width}×${sh.info.height} ${kb(sh.data.length)}`,
    ratio: main.info.width / main.info.height,
    upscaled: trimmed.height < HEIGHT,
  };
}

async function main() {
  if (!(await exists(SRC))) {
    console.error(`No input folder: ${path.relative(ROOT, SRC)}/\nCreate assets-src/wall/<slug>/front.png (see docs/WALL_ASSETS.md).`);
    process.exit(1);
  }
  let slugs = (await fs.readdir(SRC, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
  if (only.length) {
    const missing = only.filter((s) => !slugs.includes(s));
    if (missing.length) {
      console.error(`Not found in assets-src/wall/: ${missing.join(", ")}`);
      process.exit(1);
    }
    slugs = only;
  }
  if (!slugs.length) {
    console.error("assets-src/wall/ has no product folders.");
    process.exit(1);
  }

  await fs.mkdir(OUT, { recursive: true });
  const rows = [];
  const warnings = [];
  let failed = 0;

  for (const slug of slugs) {
    const dir = path.join(SRC, slug);
    try {
      const front = await findInput(dir, "front");
      if (!front) throw new Error(`missing assets-src/wall/${slug}/front.png`);
      rows.push(await processSide(slug, "front", front, { mirror: false }));

      const back = await findInput(dir, "back");
      let backRow;
      if (back) {
        backRow = await processSide(slug, "back", back, { mirror: false });
      } else if (mirrorBack) {
        backRow = await processSide(slug, "back", front, { mirror: true });
        backRow.note = "mirrored front";
        warnings.push(`${slug}: no back.png — mirrored front.png (--mirror-back). Replace it with a real back shot when you have one.`);
      } else {
        backRow = await processSide(slug, "back", front, { mirror: false });
        backRow.note = "= front";
        warnings.push(`${slug}: no back.png — back falls back to the front image (pass --mirror-back to mirror it instead).`);
      }
      rows.push(backRow);
    } catch (err) {
      failed++;
      console.error(`✗ ${slug}: ${err.message}`);
    }
  }

  for (const r of rows) {
    if (r.upscaled) warnings.push(`${r.slug}-${r.side}: source is ${r.src} after trim — shorter than ${HEIGHT}px, so it was upscaled and may look soft. Export larger.`);
    if (r.ratio < AR_MIN || r.ratio > AR_MAX) {
      warnings.push(`${r.slug}-${r.side}: w/h = ${r.ratio.toFixed(3)} is outside ${AR_MIN}–${AR_MAX}. Check the crop, or set wall.ar for this product (the wall box default is ${AR_WALL}).`);
    }
  }

  if (rows.length) {
    const table = rows.map((r) => ({
      slug: r.slug,
      side: r.side + (r.note ? ` (${r.note})` : ""),
      trimmed: r.src,
      image: r.out,
      shadow: r.shadow,
      "w/h": r.ratio.toFixed(3) + (r.ratio < AR_MIN || r.ratio > AR_MAX ? " ⚠" : ""),
    }));
    console.table(table);

    // one suggested wall.ar per product, from its front image
    const fronts = rows.filter((r) => r.side === "front");
    const needAr = fronts.filter((r) => Math.abs(r.ratio - AR_WALL) > 0.03);
    if (needAr.length) {
      console.log("Boxes that differ from the wall's default 0.84 (set wall.ar in data/pour-001.ts if the fit looks cramped or floaty):");
      for (const r of needAr) console.log(`  ${r.slug}: ar ≈ ${r.ratio.toFixed(2)}`);
    }
  }

  for (const w of warnings) console.warn(`⚠ ${w}`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

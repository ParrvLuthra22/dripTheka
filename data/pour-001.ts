// Pour #001 — hardcoded V1, maps 1:1 to future Neon schema
// Schema shape: see lib/db/schema.ts

import { DEPOSIT_PERCENT, DEFAULT_COLOURWAY_CAPACITY, depositPaiseFor } from "../lib/config"; // relative: next.config.ts loads this file without the @/ alias

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type FitType = "boxy" | "oversized" | "regular" | "slim";
export type GarmentType = "tee" | "hoodie" | "cargo" | "jacket" | "set";

export interface SizeVariant {
  size: Size;
  stock: number; // 0 = Tapped Out
  sku: string;
}

export interface WallImages {
  front: string;        // trimmed transparent cutout, ~1100px tall
  frontShadow: string;
  back: string;
  backShadow: string;
  /** Box aspect ratio (w/h). Omit for the default 0.84; hoodies/jackets often need their own. */
  ar?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Devanagari / Hinglish subtitle shown under the name on The Wall. */
  hindi: string;
  tagline: string;
  type: GarmentType;
  fit: FitType;
  price: number; // in INR paise (multiply by 100 for Razorpay)
  depositPercent: number;
  colors: string[]; // hex
  colorNames: string[];
  sizes: SizeVariant[];
  description: string;
  careInstructions: string[];
  fabric: string;
  /** Fabric weight in grams per m². Omit when not applicable (caps, shells). */
  gsm?: number;
  dropNumber: "001";
  collectionSlug: "pour-001";
  imageAlt: string;
  /** Wall number shown as "Drip Theka / 04" and "NO. 04". Wall products only. */
  code?: string;
  /** Colourway label, e.g. "Ink / Cobalt". Wall products only. */
  colourway?: string;
  /** Hex of the colourway's round swatch. Wall products only. */
  swatch?: string;
  /** Design slug shared by every colourway of one design ("no-smoking"). Wall products only. */
  design?: string;
  /** One-liner shown in the wall's product view. */
  blurb?: string;
  /**
   * Photographic cutouts for The Wall (public paths). A product only appears on
   * the wall once it has these — never put tee art on another garment.
   */
  wall?: WallImages;
  /** Demo art — fenced off from reservations/shop listings. (Nothing sets this any more.) */
  placeholderArt?: true;
  /** The front image is a plain tee until the real front print arrives. */
  frontIsStandIn?: true;
  isLimited: boolean;
  totalUnits: number;
  /** Max units of THIS colourway that can be reserved (paid + fresh pending). Default: DEFAULT_COLOURWAY_CAPACITY. */
  capacity?: number;
}

/** A product that has real wall cutouts — the only kind The Wall shows. */
export type WallProduct = Product & { wall: WallImages };
export const hasWall = (p: Product): p is WallProduct => !!p.wall;

/** One wall item: a design and its colourways (each colourway is its own product). */
export interface WallDesign {
  design: string;
  code: string;
  name: string;
  hindi: string;
  blurb: string;
  gsm: number;
  products: WallProduct[];
}

/** Group wall products by design, preserving wall order (first colourway = default). */
export function groupDesigns(products: readonly WallProduct[]): WallDesign[] {
  const map = new Map<string, WallDesign>();
  for (const p of products) {
    const key = p.design ?? p.slug;
    let d = map.get(key);
    if (!d) {
      d = { design: key, code: p.code ?? "", name: p.name, hindi: p.hindi, blurb: p.blurb ?? p.tagline, gsm: p.gsm ?? 0, products: [] };
      map.set(key, d);
    }
    d.products.push(p);
  }
  return [...map.values()];
}

/** Locate a /?fit= or /product/ slug — a design slug or a colourway slug. */
export function findWallSlug(designs: readonly WallDesign[], slug: string): { design: number; colourway: number } | null {
  for (let di = 0; di < designs.length; di++) {
    if (designs[di].design === slug) return { design: di, colourway: 0 };
    const ci = designs[di].products.findIndex((p) => p.slug === slug);
    if (ci >= 0) return { design: di, colourway: ci };
  }
  return null;
}

export interface Pour {
  slug: "pour-001";
  number: "001";
  title: string;
  subtitle: string;
  description: string;
  openingNight: string; // ISO date
  products: Product[];
  editorialNote: string;
}

// ── Pour #001: Ayaan's seven designs (The Wall) ──────────────────────────────
// One wall item per design; every colourway is its own product (own slug) so the cart,
// /api/reserve and orders know the colour with no backend change. Source of truth for the
// seed data: docs/reference/pour001/designs.json. Backs are the hero art; the fronts are
// plain stand-ins (`frontIsStandIn`) until Ayaan sends the real ones.

interface DesignSeed {
  code: string; design: string; name: string; hindi: string; blurb: string;
  colourways: { slug: string; label: string; swatch: string; back: string; front: string }[];
}

const DESIGNS: DesignSeed[] = [
  { code: "01", design: "its-done-bro", name: "Its Done Bro", hindi: "हो गया, भाई",
    blurb: "For when it's handled. Leaning back, shades on, zero follow-up questions.",
    colourways: [
      { slug: "its-done-bro-ink", label: "Ink", swatch: "#141414", back: "b01_ink", front: "f_ink" },
      { slug: "its-done-bro-bone", label: "Bone", swatch: "#e6e1d6", back: "b01_bone", front: "f_bone" },
    ] },
  { code: "02", design: "bad-influence", name: "Bad Influence", hindi: "बुरी संगत",
    blurb: "34 + 35. Two can play this game.",
    colourways: [
      { slug: "bad-influence-ink-cobalt", label: "Ink / Cobalt", swatch: "#1d4fc4", back: "b02_cobalt", front: "f_ink" },
      { slug: "bad-influence-ink-pink", label: "Ink / Pink", swatch: "#a8558f", back: "b02_pink", front: "f_ink" },
    ] },
  { code: "03", design: "richer-than-my-teacher", name: "Richer Than My Teacher", hindi: "मास्टरजी से अमीर",
    blurb: "Circled in red, like every answer you got right anyway.",
    colourways: [
      { slug: "richer-than-my-teacher-ink", label: "Ink", swatch: "#141414", back: "b03_ink", front: "f_ink" },
      { slug: "richer-than-my-teacher-cocoa", label: "Cocoa", swatch: "#3e2a24", back: "b03_cocoa", front: "f_cocoa" },
    ] },
  { code: "04", design: "absolutly-sober", name: "Absolutly Sober", hindi: "बिल्कुल होश में",
    blurb: "A smooth blend of questionable choices. Bottled by Drip Theka, 100% certified drip.",
    colourways: [
      { slug: "absolutly-sober-ink", label: "Ink", swatch: "#141414", back: "b04_ink", front: "f_ink" },
      { slug: "absolutly-sober-bone", label: "Bone", swatch: "#e6e1d6", back: "b04_bone", front: "f_bone" },
    ] },
  { code: "05", design: "no-smoking", name: "No Smoking", hindi: "धूम्रपान वर्जित*",
    blurb: "*Without me. The red-collar raglan comes in bone.",
    colourways: [
      { slug: "no-smoking-bone-red", label: "Bone / Red", swatch: "#e6e1d6", back: "b05_bone", front: "f_bone" },
      { slug: "no-smoking-ink-red", label: "Ink / Red", swatch: "#141414", back: "b05_ink", front: "f_ink" },
    ] },
  { code: "06", design: "janwar", name: "Janwar", hindi: "जानवर",
    blurb: "Harmonica out, collar up. Wear it like the interval just ended.",
    colourways: [
      { slug: "janwar-bone", label: "Bone", swatch: "#e6e1d6", back: "b06_bone", front: "f_bone" },
      { slug: "janwar-ink", label: "Ink", swatch: "#141414", back: "b06_ink", front: "f_ink" },
    ] },
  { code: "07", design: "aap-zara", name: "Aap Zara?", hindi: "आप ज़रा फ़क ऑफ होंगे?",
    blurb: "Enlightened. Headphones on. Politely asking you to leave.",
    colourways: [
      { slug: "aap-zara-bone", label: "Bone", swatch: "#e6e1d6", back: "b07_bone", front: "f_bone" },
      { slug: "aap-zara-ink", label: "Ink", swatch: "#141414", back: "b07_ink", front: "f_ink" },
    ] },
];

const TEE_STOCK: [Size, number][] = [["S", 30], ["M", 50], ["L", 50], ["XL", 40], ["XXL", 30]];
const WALL_DIR = "/theka/wall/pour001";
export const POUR_001_PRICE = 129900; // ₹1,299 in paise

const WALL_TEES: Product[] = DESIGNS.flatMap((d, di) =>
  d.colourways.map((c, ci): Product => {
    const n = DESIGNS.slice(0, di).reduce((t, x) => t + x.colourways.length, 0) + ci;
    const id = `dt-001-${String(7 + n).padStart(3, "0")}`;
    return {
      id, slug: c.slug, name: d.name, hindi: d.hindi, code: d.code, design: d.design,
      colourway: c.label, swatch: c.swatch, blurb: d.blurb,
      tagline: d.blurb,
      type: "tee",
      fit: "oversized",
      price: POUR_001_PRICE,
      depositPercent: DEPOSIT_PERCENT,
      colors: [c.swatch],
      colorNames: [c.label],
      sizes: TEE_STOCK.map(([size, stock]) => ({ size, stock, sku: `${id.toUpperCase()}-${size}` })),
      description: `${d.blurb} 400 GSM cotton, oversized with a dropped shoulder, screen-printed in Delhi.`,
      careInstructions: ["Wash cold inside out", "Air dry flat", "Low iron on reverse"],
      fabric: "100% combed ring-spun cotton, 400gsm",
      gsm: 400,
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: `${d.name} tee, ${c.label}`,
      isLimited: true,
      totalUnits: 200,
      capacity: DEFAULT_COLOURWAY_CAPACITY,
      wall: {
        front:       `${WALL_DIR}/${c.front}.webp`,
        frontShadow: `${WALL_DIR}/${c.front}_sh.webp`,
        back:        `${WALL_DIR}/${c.back}.webp`,
        backShadow:  `${WALL_DIR}/${c.back}_sh.webp`,
        ar: 1.0,
      },
      frontIsStandIn: true,
    };
  }),
);

export const POUR_001: Pour = {
  slug: "pour-001",
  number: "001",
  title: "The First Round",
  subtitle: "We opened. You showed up. Let's not overthink it.",
  description:
    "Pour #001 is the opening night. Six pieces, one colourway, zero compromises. Cobalt, cream, ink — the only palette that matters.",
  openingNight: "2024-12-01T18:00:00+05:30",
  editorialNote:
    "We made 200 of each. We're not restocking. When it's done, it's done. That's the whole point.",
  products: [
    {
      id: "dt-001-001",
      slug: "first-round-tee",
      name: "First Round Tee",
      hindi: "पहला राउंड",
      tagline: "The one you'll wear until it falls apart.",
      type: "tee",
      fit: "boxy",
      price: 249900, // ₹2,499
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#004AAD", "#E4E2DD", "#141518"],
      colorNames: ["Cobalt", "Cream", "Ink"],
      sizes: [
        { size: "XS", stock: 12, sku: "DT-001-001-XS" },
        { size: "S", stock: 34, sku: "DT-001-001-S" },
        { size: "M", stock: 40, sku: "DT-001-001-M" },
        { size: "L", stock: 38, sku: "DT-001-001-L" },
        { size: "XL", stock: 30, sku: "DT-001-001-XL" },
        { size: "XXL", stock: 0, sku: "DT-001-001-XXL" },
      ],
      description:
        "400gsm heavyweight cotton. Boxy cut. Drop shoulder. Screen-printed drip theka wordmark on the back in cream. Front: a wine glass, left chest.",
      careInstructions: [
        "Cold wash inside out",
        "No tumble dry",
        "Iron inside out on low",
        "Don't bleach it — it's not a hospital gown",
      ],
      fabric: "100% combed ring-spun cotton, 400gsm",
      gsm: 400,
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Boxy cobalt blue tee with cream wine glass logo on left chest",
      isLimited: true,
      totalUnits: 200,
    },
    {
      id: "dt-001-002",
      slug: "last-call-hoodie",
      name: "Last Call Hoodie",
      hindi: "आख़िरी बुलावा",
      tagline: "For when the party moves to your rooftop.",
      type: "hoodie",
      fit: "oversized",
      price: 449900, // ₹4,499
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#141518", "#004AAD"],
      colorNames: ["Ink", "Cobalt"],
      sizes: [
        { size: "S", stock: 20, sku: "DT-001-002-S" },
        { size: "M", stock: 35, sku: "DT-001-002-M" },
        { size: "L", stock: 40, sku: "DT-001-002-L" },
        { size: "XL", stock: 30, sku: "DT-001-002-XL" },
        { size: "XXL", stock: 15, sku: "DT-001-002-XXL" },
      ],
      description:
        "560gsm fleece. Kangaroo pocket. Ribbed cuffs and hem. 'LAST CALL' embroidered in cobalt across the back yoke. The one you'll fight over.",
      careInstructions: [
        "Wash cold inside out",
        "Air dry flat",
        "Low iron on reverse",
      ],
      fabric: "85% cotton / 15% polyester fleece, 560gsm",
      gsm: 560,
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Ink black oversized hoodie with LAST CALL embroidery on back",
      isLimited: true,
      totalUnits: 200,
    },
    {
      id: "dt-001-003",
      slug: "regular-cargo",
      name: "The Regular Cargo",
      hindi: "रोज़ वाला",
      tagline: "Pockets for your problems. Fit for the front row.",
      type: "cargo",
      fit: "regular",
      price: 379900, // ₹3,799
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#E4E2DD", "#141518"],
      colorNames: ["Cream", "Ink"],
      sizes: [
        { size: "XS", stock: 8, sku: "DT-001-003-XS" },
        { size: "S", stock: 25, sku: "DT-001-003-S" },
        { size: "M", stock: 40, sku: "DT-001-003-M" },
        { size: "L", stock: 35, sku: "DT-001-003-L" },
        { size: "XL", stock: 20, sku: "DT-001-003-XL" },
      ],
      description:
        "Ripstop canvas. Six pockets. Zip fly. 'POUR 001' stamped in mono on the left cargo pocket. Adjustable ankle tabs.",
      careInstructions: [
        "Machine wash cold",
        "Tumble dry low",
        "Do not iron the stamp directly",
      ],
      fabric: "100% cotton ripstop canvas, 280gsm",
      gsm: 280,
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Cream cargo pants with POUR 001 stamp on left pocket",
      isLimited: true,
      totalUnits: 200,
    },
    {
      id: "dt-001-004",
      slug: "opening-night-jacket",
      name: "Opening Night Jacket",
      hindi: "पहली रात",
      tagline: "The reason you came.",
      type: "jacket",
      fit: "regular",
      price: 699900, // ₹6,999
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#004AAD"],
      colorNames: ["Cobalt"],
      sizes: [
        { size: "S", stock: 15, sku: "DT-001-004-S" },
        { size: "M", stock: 25, sku: "DT-001-004-M" },
        { size: "L", stock: 30, sku: "DT-001-004-L" },
        { size: "XL", stock: 20, sku: "DT-001-004-XL" },
      ],
      description:
        "Waxed cotton outer. Quilted cream liner. Snap buttons. 'DRIP THEKA' arch text in cream on back. The piece everyone asks about.",
      careInstructions: [
        "Dry clean only",
        "Hang dry, no dryer",
        "Re-wax annually to maintain water resistance",
      ],
      fabric: "Waxed cotton shell, quilted polyester fill, cotton liner",
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Cobalt waxed cotton jacket with cream quilted liner",
      isLimited: true,
      totalUnits: 100,
    },
    {
      id: "dt-001-005",
      slug: "tapped-out-set",
      name: "Tapped Out Set",
      hindi: "खतम",
      tagline: "Matching sets for people who have their life together (mostly).",
      type: "set",
      fit: "boxy",
      price: 549900, // ₹5,499
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#E4E2DD"],
      colorNames: ["Cream"],
      sizes: [
        { size: "S", stock: 0, sku: "DT-001-005-S" },
        { size: "M", stock: 0, sku: "DT-001-005-M" },
        { size: "L", stock: 0, sku: "DT-001-005-L" },
        { size: "XL", stock: 0, sku: "DT-001-005-XL" },
      ],
      description:
        "Cream set — boxy half-zip and elastic-waist shorts. Printed wine glass on the back hem of the shorts. Minimal. Intentional. Loud in person.",
      careInstructions: [
        "Cold wash gentle cycle",
        "Air dry flat",
        "Do not wring",
      ],
      fabric: "French terry, 380gsm, 95% cotton / 5% elastane",
      gsm: 380,
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Cream matching set with wine glass print on shorts back hem",
      isLimited: true,
      totalUnits: 150,
    },
    {
      id: "dt-001-006",
      slug: "wrong-theka-cap",
      name: "Wrong Theka Cap",
      hindi: "ग़लत ठेका",
      tagline: "You found it. That's enough.",
      type: "tee", // using tee as closest type for accessories in V1
      fit: "regular",
      price: 149900, // ₹1,499
      depositPercent: DEPOSIT_PERCENT,
      colors: ["#141518", "#004AAD", "#E4E2DD"],
      colorNames: ["Ink", "Cobalt", "Cream"],
      sizes: [
        { size: "S", stock: 50, sku: "DT-001-006-S" },
        { size: "M", stock: 60, sku: "DT-001-006-M" },
        { size: "L", stock: 40, sku: "DT-001-006-L" },
      ],
      description:
        "6-panel structured cap. 'WRONG THEKA' embroidered on the front in contrast. Adjustable strap. The collab piece — pairs with everything.",
      careInstructions: [
        "Spot clean only",
        "Air dry",
        "Do not machine wash",
      ],
      fabric: "Cotton twill, unstructured front panels, structured back",
      dropNumber: "001",
      collectionSlug: "pour-001",
      imageAlt: "Ink structured 6-panel cap with WRONG THEKA embroidery",
      isLimited: true,
      totalUnits: 300,
    },
    ...WALL_TEES,
  ],
};

/**
 * Demo (`placeholderArt`) tees live on The Wall only. They can go in a bag, but
 * they are fenced off from reservations, DB seeding and every shop listing until
 * real designs replace the placeholder art.
 */
export const isPouring = (p: Product): boolean => !p.placeholderArt;
export const POURING_PRODUCTS: Product[] = POUR_001.products.filter(isPouring);

/** One shop-listing card: a design (or a lone product) and its colourways. */
export interface ListingEntry {
  key: string;
  /** The first colourway — the card links to its /product/ page. */
  product: Product;
  /** Every colourway of the design, first = `product`. A lone product has just itself. */
  variants: Product[];
}

/** Group colourway products by design for listings, keeping first-seen order. */
export function groupListing(products: readonly Product[]): ListingEntry[] {
  const map = new Map<string, ListingEntry>();
  for (const p of products) {
    const key = p.design ?? p.slug;
    const hit = map.get(key);
    if (hit) hit.variants.push(p);
    else map.set(key, { key, product: p, variants: [p] });
  }
  return [...map.values()];
}

/** Shop listings: 7 design cards for Pour #001 + the 6 single products. */
export const POURING_LISTING: ListingEntry[] = groupListing(POURING_PRODUCTS);

export function getPriceDisplay(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function getDepositAmount(paise: number): number {
  return depositPaiseFor(paise);
}

export function isTappedOut(variants: SizeVariant[]): boolean {
  return variants.every((v) => v.stock === 0);
}

export function getAvailableSizes(variants: SizeVariant[]): SizeVariant[] {
  return variants.filter((v) => v.stock > 0);
}

// ── The Board — homepage "what's on tap" helpers ─────────────────────────

/** Units sold so far = total minted minus what's still on the shelf. */
export function getUnitsPoured(product: Product): number {
  const remaining = product.sizes.reduce((sum, v) => sum + v.stock, 0);
  return product.totalUnits - remaining;
}

/** Best-sellers — highest units poured first. */
export function getMostPoured(limit = 4): Product[] {
  return [...POUR_001.products]
    .sort((a, b) => getUnitsPoured(b) - getUnitsPoured(a))
    .slice(0, limit);
}

/** Newest additions to the pour — last in the lineup, most recent first. */
export function getFreshPour(limit = 4): Product[] {
  return [...POUR_001.products].slice(-limit).reverse();
}

// ── Bartender's Pick ─────────────────────────────────────────────────────
// Manually curated weekly pick — surfaced in the homepage BartendersPick section.

export interface BartendersPickData {
  productSlug: string;
  pickedBy: "Ayaan" | "Parrv";
  quote: string;
  date: string; // ISO
}

export const BARTENDERS_PICK: BartendersPickData = {
  productSlug: "last-call-hoodie",
  pickedBy: "Ayaan",
  quote:
    "I designed three jackets before this hoodie happened by accident. Sometimes the side quest is the main quest.",
  date: "2026-06-01T00:00:00+05:30",
};

/** Reservable units for a colourway/product. */
export const capacityOf = (p: Product): number => p.capacity ?? DEFAULT_COLOURWAY_CAPACITY;

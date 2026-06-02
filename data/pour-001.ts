// Pour #001 — hardcoded V1, maps 1:1 to future Neon schema
// Schema shape: see lib/db/schema.ts

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";
export type FitType = "boxy" | "oversized" | "regular" | "slim";
export type GarmentType = "tee" | "hoodie" | "cargo" | "jacket" | "set";

export interface SizeVariant {
  size: Size;
  stock: number; // 0 = Tapped Out
  sku: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  type: GarmentType;
  fit: FitType;
  price: number; // in INR paise (multiply by 100 for Razorpay)
  depositPercent: 30;
  colors: string[]; // hex
  colorNames: string[];
  sizes: SizeVariant[];
  description: string;
  careInstructions: string[];
  fabric: string;
  dropNumber: "001";
  collectionSlug: "pour-001";
  imageAlt: string;
  isLimited: boolean;
  totalUnits: number;
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
      tagline: "The one you'll wear until it falls apart.",
      type: "tee",
      fit: "boxy",
      price: 249900, // ₹2,499
      depositPercent: 30,
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
      tagline: "For when the party moves to your rooftop.",
      type: "hoodie",
      fit: "oversized",
      price: 449900, // ₹4,499
      depositPercent: 30,
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
      tagline: "Pockets for your problems. Fit for the front row.",
      type: "cargo",
      fit: "regular",
      price: 379900, // ₹3,799
      depositPercent: 30,
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
      tagline: "The reason you came.",
      type: "jacket",
      fit: "regular",
      price: 699900, // ₹6,999
      depositPercent: 30,
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
      tagline: "Matching sets for people who have their life together (mostly).",
      type: "set",
      fit: "boxy",
      price: 549900, // ₹5,499
      depositPercent: 30,
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
      tagline: "You found it. That's enough.",
      type: "tee", // using tee as closest type for accessories in V1
      fit: "regular",
      price: 149900, // ₹1,499
      depositPercent: 30,
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
  ],
};

export function getPriceDisplay(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function getDepositAmount(paise: number): number {
  return Math.round(paise * 0.3);
}

export function isTappedOut(variants: SizeVariant[]): boolean {
  return variants.every((v) => v.stock === 0);
}

export function getAvailableSizes(variants: SizeVariant[]): SizeVariant[] {
  return variants.filter((v) => v.stock > 0);
}

/**
 * @backend — Drip Theka server-side barrel.
 *
 * Everything exported from here runs ONLY on the server (Node.js / Neon edge).
 * Never import this from "use client" components — it will throw.
 *
 * Usage (in API routes, Server Components, auth.ts):
 *   import { db, schema, createRazorpayOrder } from "@backend";
 *
 * Architecture note:
 *   All server code lives in lib/ — this barrel re-exports it under
 *   the cleaner @backend alias. The underlying files are unchanged
 *   so existing @/lib/* imports continue to work.
 */

// ── Database ──────────────────────────────────────────────────────────────
export { db, generateOrderNumber, generateReferralCode } from "@/lib/db/client";
export * as schema from "@/lib/db/schema";

// ── Razorpay ──────────────────────────────────────────────────────────────
export {
  createRazorpayOrder,
  verifyPaymentSignature,
  getPublicKeyId,
} from "@/lib/razorpay/client";

// ── Klaviyo ───────────────────────────────────────────────────────────────
export { subscribeToList } from "@/lib/klaviyo/index";

// ── Static data (server-safe) ─────────────────────────────────────────────
export { POUR_001 } from "@/data/pour-001";
export { POUR, pourClosesAt, isPourClosed, DEPOSIT_PERCENT } from "@/lib/config";
export { BUILDING_POSTS, getBuildingPost, getAdjacentPosts } from "@/data/building";
export { LEGAL_DOCS, getLegalDoc } from "@/data/legal";

// ── Shared types (inferred from Drizzle schema) ───────────────────────────
export type {
  Regular, NewRegular,
  Reservation, NewReservation,
  ReservationItem, NewReservationItem,
  Referral,
  PourProgress,
  ReserveCountCache,
  ShippingAddress,
} from "@/lib/db/schema";

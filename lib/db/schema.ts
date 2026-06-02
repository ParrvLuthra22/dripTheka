// Drip Theka — Drizzle ORM schema for Neon Postgres.
//
// V1 uses hardcoded data in /data/pour-001.ts.
// This schema provides the persistence layer for:
//   regulars      — newsletter sign-ups with referral codes
//   reservations  — deposit-based pre-orders
//   reservation_items — line items per reservation
//   referrals     — referral code ledger
//   reserve_count_cache — per-product reservation counter (fill bar reads this)
//   pour_progress — per-pour overall progress (fill bar target)
//   products      — V1.1 migration target for /data/pour-001.ts

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ── Enums ─────────────────────────────────────────────────────────────────

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",       // deposit order created, payment not confirmed
  "deposit_paid",  // Razorpay payment verified
  "drop_unlocked", // pour is live — balance payment link sent
  "fulfilled",     // shipped
  "refunded",      // deposit refunded
  "cancelled",     // order cancelled
]);

// ── Shared types ──────────────────────────────────────────────────────────

/** Shipping address stored as JSON inside reservations.address */
export type ShippingAddress = {
  line1:   string;
  line2?:  string;
  city:    string;
  state:   string;
  pincode: string;
};

// ── regulars ──────────────────────────────────────────────────────────────
// Last Call newsletter sign-ups. Each Regular gets a unique referral code.

export const regulars = pgTable("regulars", {
  id:             uuid("id").primaryKey().defaultRandom(),
  email:          text("email").notNull().unique(),
  name:           text("name").notNull(),
  city:           text("city").notNull(),
  college:        text("college"),
  instagram:      text("instagram"),
  referralSource: text("referral_source"),           // how they heard about us
  referralCode:   text("referral_code").notNull().unique(), // 8-char uppercase
  referredBy:     text("referred_by"),               // code that brought them in
  klaviyoId:      text("klaviyo_id"),                // set after Klaviyo sync
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// ── reservations ──────────────────────────────────────────────────────────
// A reservation = one deposit-based pre-order. Order number format: DT-2026-XXXXX.

export const reservations = pgTable("reservations", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  orderNumber:        text("order_number").notNull().unique(),   // DT-YYYY-NNNNN
  email:              text("email").notNull(),
  name:               text("name").notNull(),
  phone:              text("phone").notNull(),
  address:            jsonb("address").$type<ShippingAddress>().notNull(),
  subtotalPaise:      integer("subtotal_paise").notNull(),       // full order value
  depositPaise:       integer("deposit_paise").notNull(),        // 30% charged now
  balancePaise:       integer("balance_paise").notNull(),        // 70% on drop
  razorpayOrderId:    text("razorpay_order_id").notNull(),
  razorpayPaymentId:  text("razorpay_payment_id"),              // set after payment
  status:             reservationStatusEnum("status").notNull().default("pending"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
});

// ── reservation_items ─────────────────────────────────────────────────────
// Line items for a reservation. One row per (product + size) combo.

export const reservationItems = pgTable("reservation_items", {
  id:             uuid("id").primaryKey().defaultRandom(),
  reservationId:  uuid("reservation_id")
                    .notNull()
                    .references(() => reservations.id, { onDelete: "cascade" }),
  productSlug:    text("product_slug").notNull(),
  productName:    text("product_name").notNull(),
  size:           text("size").notNull(),
  qty:            integer("qty").notNull(),
  unitPricePaise: integer("unit_price_paise").notNull(),
  lineTotalPaise: integer("line_total_paise").notNull(),        // unitPrice × qty
});

// ── referrals ─────────────────────────────────────────────────────────────
// Tracks each referral code and how many new Regulars it brought in.

export const referrals = pgTable("referrals", {
  id:          uuid("id").primaryKey().defaultRandom(),
  code:        text("code").notNull().unique(),
  ownerEmail:  text("owner_email")
                 .notNull()
                 .references(() => regulars.email, { onDelete: "cascade" }),
  redemptions: integer("redemptions").notNull().default(0),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

// ── reserve_count_cache ───────────────────────────────────────────────────
// Cached reservation count per product — updated after each deposit_paid event.
// The fill bar polls /api/reserve/count which reads this table.

export const reserveCountCache = pgTable("reserve_count_cache", {
  productSlug:   text("product_slug").primaryKey(),
  reservedCount: integer("reserved_count").notNull().default(0),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

// ── pour_progress ─────────────────────────────────────────────────────────
// Overall reserved/target for a pour. The fill bar on /pour/[slug] reads this.
// `unlocked_at` is set when reserved >= target (Opening Night trigger).

export const pourProgress = pgTable("pour_progress", {
  pourSlug:   text("pour_slug").primaryKey(), // e.g. "001"
  reserved:   integer("reserved").notNull().default(0),
  target:     integer("target").notNull().default(100),
  unlockedAt: timestamp("unlocked_at"),       // null = not yet unlocked
});

// ── products ──────────────────────────────────────────────────────────────
// V1.1 migration target — lift /data/pour-001.ts into this table.
// V1: not used for reads; schema exists for schema-first migration.

export const products = pgTable("products", {
  id:               text("id").primaryKey(),
  slug:             text("slug").notNull().unique(),
  collectionSlug:   text("collection_slug").notNull(),
  name:             text("name").notNull(),
  tagline:          text("tagline").notNull(),
  type:             text("type").notNull(),
  fit:              text("fit").notNull(),
  price:            integer("price").notNull(),                  // paise
  depositPercent:   integer("deposit_percent").notNull().default(30),
  colors:           jsonb("colors").notNull().$type<string[]>(),
  colorNames:       jsonb("color_names").notNull().$type<string[]>(),
  sizes:            jsonb("sizes").notNull(),                    // SizeVariant[]
  description:      text("description").notNull(),
  careInstructions: jsonb("care_instructions").notNull().$type<string[]>(),
  fabric:           text("fabric").notNull(),
  imageAlt:         text("image_alt").notNull(),
  isLimited:        boolean("is_limited").notNull().default(true),
  totalUnits:       integer("total_units").notNull(),
  createdAt:        timestamp("created_at").defaultNow(),
});

// ── Relations ─────────────────────────────────────────────────────────────

export const reservationsRelations = relations(reservations, ({ many }) => ({
  items: many(reservationItems),
}));

export const reservationItemsRelations = relations(reservationItems, ({ one }) => ({
  reservation: one(reservations, {
    fields:     [reservationItems.reservationId],
    references: [reservations.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  owner: one(regulars, {
    fields:     [referrals.ownerEmail],
    references: [regulars.email],
  }),
}));

export const regularsRelations = relations(regulars, ({ one }) => ({
  referral: one(referrals, {
    fields:     [regulars.referralCode],
    references: [referrals.code],
  }),
}));

// ── TypeScript inferred types ─────────────────────────────────────────────
// Use these everywhere — never type raw SQL objects manually.

export type Regular            = InferSelectModel<typeof regulars>;
export type NewRegular         = InferInsertModel<typeof regulars>;
export type Reservation        = InferSelectModel<typeof reservations>;
export type NewReservation     = InferInsertModel<typeof reservations>;
export type ReservationItem    = InferSelectModel<typeof reservationItems>;
export type NewReservationItem = InferInsertModel<typeof reservationItems>;
export type Referral           = InferSelectModel<typeof referrals>;
export type NewReferral        = InferInsertModel<typeof referrals>;
export type PourProgress       = InferSelectModel<typeof pourProgress>;
export type ReserveCountCache  = InferSelectModel<typeof reserveCountCache>;

// Drip Theka — Drizzle ORM schema for Neon Postgres.
//
// Tables:
//   Auth (NextAuth v5):  users, accounts, sessions, verification_tokens
//   Business:           regulars, reservations, reservation_items,
//                        referrals, reserve_count_cache, pour_progress,
//                        products (V1.1 target)

import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";
import { relations } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

// ── NextAuth v5 tables ────────────────────────────────────────────────────
// Required by @auth/drizzle-adapter. Shape matches Auth.js spec exactly.

export const users = pgTable("users", {
  id:            text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name:          text("name"),
  email:         text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image:         text("image"),
  // Drip Theka extras stored on the user row
  referralCode:  text("referral_code").unique(),
  createdAt:     timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  userId:              text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:                text("type").$type<AdapterAccountType>().notNull(),
  provider:            text("provider").notNull(),
  providerAccountId:   text("provider_account_id").notNull(),
  refresh_token:       text("refresh_token"),
  access_token:        text("access_token"),
  expires_at:          integer("expires_at"),
  token_type:          text("token_type"),
  scope:               text("scope"),
  id_token:            text("id_token"),
  session_state:       text("session_state"),
}, (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires:      timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull(),
  expires:    timestamp("expires", { mode: "date" }).notNull(),
}, (t) => [primaryKey({ columns: [t.identifier, t.token] })]);

// ── Auth relations ────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  accounts:     many(accounts),
  sessions:     many(sessions),
  reservations: many(reservations, { relationName: "userReservations" }),
}));

// ── Enums ─────────────────────────────────────────────────────────────────

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",       // deposit order created, payment not confirmed (holds stock for POUR.holdMinutes)
  "deposit_paid",  // Razorpay payment verified
  "drop_unlocked", // pour is live — balance payment link sent
  "fulfilled",     // shipped
  "refunded",      // deposit refunded
  "cancelled",     // order cancelled
  "failed",        // Razorpay reported payment.failed (row kept; can still flip to deposit_paid on a retry)
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
// A reservation = one deposit-based pre-order. Order number format: DT-XXXXXXXXXX.

export const reservations = pgTable("reservations", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  orderNumber:        text("order_number").notNull().unique(),   // DT-XXXXXXXXXX
  userId:             text("user_id").references(() => users.id, { onDelete: "set null" }), // nullable — guest checkout
  email:              text("email").notNull(),
  name:               text("name").notNull(),
  phone:              text("phone").notNull(),
  address:            jsonb("address").$type<ShippingAddress>().notNull(),
  subtotalPaise:      integer("subtotal_paise").notNull(),       // full order value
  depositPaise:       integer("deposit_paise").notNull(),        // 30% charged now
  balancePaise:       integer("balance_paise").notNull(),        // 70% on drop
  // `pending:<reservation id>` until the Razorpay order exists, so the unique index below holds.
  razorpayOrderId:    text("razorpay_order_id").notNull(),
  razorpayPaymentId:  text("razorpay_payment_id"),              // set after payment
  referralCode:       text("referral_code"),                     // referrer's code, validated at reserve time
  status:             reservationStatusEnum("status").notNull().default("pending"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("reservations_razorpay_order_id_unique").on(t.razorpayOrderId),
  uniqueIndex("reservations_razorpay_payment_id_unique").on(t.razorpayPaymentId),
  index("reservations_email_idx").on(t.email),
  index("reservations_user_id_idx").on(t.userId),
  index("reservations_status_created_idx").on(t.status, t.createdAt),
]);

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
}, (t) => [
  index("reservation_items_slug_idx").on(t.productSlug),
  index("reservation_items_reservation_idx").on(t.reservationId),
]);

// ── payment_events ────────────────────────────────────────────────────────
// Razorpay webhook event ids we have already processed (retries are no-ops).
// Inserted in the SAME transaction as the state change it caused.

export const paymentEvents = pgTable("payment_events", {
  id:        text("id").primaryKey(),        // X-Razorpay-Event-Id
  event:     text("event").notNull(),        // e.g. payment.captured
  outcome:   text("outcome").notNull(),      // what we did, e.g. "marked_paid", "rejected:amount_mismatch"
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

// ── referral_redemptions ──────────────────────────────────────────────────
// One row per reservation that used a referral code, written in the same transaction
// that marks the deposit paid. UNIQUE(reservation_id) = at most one redemption per reservation.

export const referralRedemptions = pgTable("referral_redemptions", {
  id:            uuid("id").primaryKey().defaultRandom(),
  reservationId: uuid("reservation_id").notNull().references(() => reservations.id, { onDelete: "cascade" }),
  code:          text("code").notNull().references(() => referrals.code, { onDelete: "cascade" }),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("referral_redemptions_reservation_unique").on(t.reservationId),
  index("referral_redemptions_code_idx").on(t.code),
]);

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
export type PaymentEvent        = InferSelectModel<typeof paymentEvents>;
export type ReserveCountCache  = InferSelectModel<typeof reserveCountCache>;

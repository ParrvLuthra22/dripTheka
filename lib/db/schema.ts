// Future Neon schema — V1 uses hardcoded data from /data/pour-001.ts
// Shape mirrors Pour/Product types so migration is a lift-and-shift

import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  type: text("type").notNull(),
  fit: text("fit").notNull(),
  price: integer("price").notNull(), // paise
  depositPercent: integer("deposit_percent").notNull().default(30),
  colors: jsonb("colors").notNull(), // string[]
  colorNames: jsonb("color_names").notNull(), // string[]
  sizes: jsonb("sizes").notNull(), // SizeVariant[]
  description: text("description").notNull(),
  careInstructions: jsonb("care_instructions").notNull(), // string[]
  fabric: text("fabric").notNull(),
  dropNumber: text("drop_number").notNull(),
  collectionSlug: text("collection_slug").notNull(),
  imageAlt: text("image_alt").notNull(),
  isLimited: boolean("is_limited").notNull().default(true),
  totalUnits: integer("total_units").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  razorpayOrderId: text("razorpay_order_id").unique(),
  razorpayPaymentId: text("razorpay_payment_id"),
  email: text("email").notNull(),
  phone: text("phone"),
  items: jsonb("items").notNull(), // CartItem[]
  depositPaid: integer("deposit_paid").notNull(), // paise
  totalAmount: integer("total_amount").notNull(), // paise
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  klaviyoId: text("klaviyo_id"),
  source: text("source").notNull().default("last-call"),
  createdAt: timestamp("created_at").defaultNow(),
});

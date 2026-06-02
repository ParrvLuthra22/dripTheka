CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'deposit_paid', 'drop_unlocked', 'fulfilled', 'refunded', 'cancelled');--> statement-breakpoint
CREATE TABLE "pour_progress" (
	"pour_slug" text PRIMARY KEY NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"target" integer DEFAULT 100 NOT NULL,
	"unlocked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"collection_slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"type" text NOT NULL,
	"fit" text NOT NULL,
	"price" integer NOT NULL,
	"deposit_percent" integer DEFAULT 30 NOT NULL,
	"colors" jsonb NOT NULL,
	"color_names" jsonb NOT NULL,
	"sizes" jsonb NOT NULL,
	"description" text NOT NULL,
	"care_instructions" jsonb NOT NULL,
	"fabric" text NOT NULL,
	"image_alt" text NOT NULL,
	"is_limited" boolean DEFAULT true NOT NULL,
	"total_units" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"owner_email" text NOT NULL,
	"redemptions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "regulars" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"college" text,
	"instagram" text,
	"referral_source" text,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"klaviyo_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "regulars_email_unique" UNIQUE("email"),
	CONSTRAINT "regulars_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "reservation_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"product_slug" text NOT NULL,
	"product_name" text NOT NULL,
	"size" text NOT NULL,
	"qty" integer NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"line_total_paise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"address" jsonb NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"deposit_paise" integer NOT NULL,
	"balance_paise" integer NOT NULL,
	"razorpay_order_id" text NOT NULL,
	"razorpay_payment_id" text,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "reserve_count_cache" (
	"product_slug" text PRIMARY KEY NOT NULL,
	"reserved_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_owner_email_regulars_email_fk" FOREIGN KEY ("owner_email") REFERENCES "public"."regulars"("email") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_items" ADD CONSTRAINT "reservation_items_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
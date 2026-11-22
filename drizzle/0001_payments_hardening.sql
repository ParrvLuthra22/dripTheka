ALTER TYPE "public"."reservation_status" ADD VALUE IF NOT EXISTS 'failed';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"outcome" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	"referral_code" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN IF NOT EXISTS "user_id" text;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_id_users_id_fk') THEN
    ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_users_id_fk') THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_user_id_users_id_fk') THEN
    ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservation_items_slug_idx" ON "reservation_items" USING btree ("product_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservation_items_reservation_idx" ON "reservation_items" USING btree ("reservation_id");--> statement-breakpoint
-- Data fixes (idempotent), before the unique indexes below.
-- 1. Old rows used the literal 'pending' as the placeholder order id; make them unique.
UPDATE "reservations" SET "razorpay_order_id" = 'pending:' || "id" WHERE "razorpay_order_id" = 'pending';--> statement-breakpoint
-- 2. Link existing orders to accounts where the email matches a user.
UPDATE "reservations" r SET "user_id" = u."id" FROM "users" u WHERE r."user_id" IS NULL AND lower(u."email") = lower(r."email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reservations_razorpay_order_id_unique" ON "reservations" USING btree ("razorpay_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reservations_razorpay_payment_id_unique" ON "reservations" USING btree ("razorpay_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservations_email_idx" ON "reservations" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservations_user_id_idx" ON "reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reservations_status_created_idx" ON "reservations" USING btree ("status","created_at");
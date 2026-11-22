ALTER TABLE "reservations" ADD COLUMN "wa_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "balance_method" text;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_balance_method_check" CHECK ("reservations"."balance_method" IS NULL OR "reservations"."balance_method" IN ('online', 'cod'));
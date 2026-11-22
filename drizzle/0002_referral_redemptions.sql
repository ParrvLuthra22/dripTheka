CREATE TABLE "referral_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_code_referrals_code_fk" FOREIGN KEY ("code") REFERENCES "public"."referrals"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "referral_redemptions_reservation_unique" ON "referral_redemptions" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "referral_redemptions_code_idx" ON "referral_redemptions" USING btree ("code");
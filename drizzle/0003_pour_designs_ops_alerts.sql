CREATE TABLE "ops_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"design_id" text,
	"reservation_id" uuid,
	"message" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pour_designs" (
	"pour_id" text NOT NULL,
	"design_id" text NOT NULL,
	"cap" integer NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	CONSTRAINT "pour_designs_pour_id_design_id_pk" PRIMARY KEY("pour_id","design_id"),
	CONSTRAINT "pour_designs_status_check" CHECK ("pour_designs"."status" IN ('open', 'tapped', 'refilling')),
	CONSTRAINT "pour_designs_cap_check" CHECK ("pour_designs"."cap" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ops_alerts" ADD CONSTRAINT "ops_alerts_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ops_alerts_kind_reservation_design_unique" ON "ops_alerts" USING btree ("kind","reservation_id","design_id");--> statement-breakpoint
CREATE INDEX "ops_alerts_open_idx" ON "ops_alerts" USING btree ("resolved_at","created_at");
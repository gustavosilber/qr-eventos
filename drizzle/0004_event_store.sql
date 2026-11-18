ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "public_slug" text;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "published" text DEFAULT 'false' NOT NULL;
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "cover_image" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "events_public_slug_unique" ON "events" ("public_slug") WHERE "public_slug" IS NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"config" text,
	"enabled" text DEFAULT 'true' NOT NULL,
	"sort_order" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_payment_methods" ADD CONSTRAINT "event_payment_methods_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_surname" text,
	"buyer_email" text,
	"buyer_dni" text,
	"payment_method_id" text,
	"payment_method_type" text NOT NULL,
	"status" text DEFAULT 'pending_payment' NOT NULL,
	"amount_cents" text NOT NULL,
	"currency" text NOT NULL,
	"reference_code" text,
	"attendee_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "event_orders" ADD CONSTRAINT "event_orders_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "event_orders" ADD CONSTRAINT "event_orders_tier_id_event_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."event_tiers"("id") ON DELETE no action ON UPDATE no action;

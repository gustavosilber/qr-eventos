CREATE TABLE "event_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"price_cents" text NOT NULL,
	"currency" text NOT NULL,
	"quantity" text NOT NULL,
	"sold" text DEFAULT '0' NOT NULL,
	"sales_start" timestamp with time zone,
	"sales_end" timestamp with time zone,
	"per_buyer_limit" text,
	"visibility" text DEFAULT 'public' NOT NULL,
	"sort_order" text DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_passes" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"code" text NOT NULL,
	"issued_by_user_id" text NOT NULL,
	"note" text,
	"expires_at" timestamp with time zone,
	"redeemed" text DEFAULT 'false' NOT NULL,
	"redeemed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_tiers" ADD CONSTRAINT "event_tiers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD CONSTRAINT "guest_passes_issued_by_user_id_users_id_fk" FOREIGN KEY ("issued_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
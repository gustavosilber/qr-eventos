CREATE TABLE "event_attendees" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"full_name" text NOT NULL,
	"name" text,
	"surname" text,
	"label" text,
	"source" text DEFAULT 'free_pass' NOT NULL,
	"verified" text DEFAULT 'false' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
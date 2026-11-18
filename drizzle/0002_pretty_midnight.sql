ALTER TABLE "guest_passes" ADD COLUMN "beneficiary_name" text;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD COLUMN "beneficiary_surname" text;--> statement-breakpoint
ALTER TABLE "guest_passes" ADD COLUMN "assigned_at" timestamp with time zone;
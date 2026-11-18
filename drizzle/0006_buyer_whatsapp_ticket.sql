ALTER TABLE "event_orders" ADD COLUMN IF NOT EXISTS "buyer_whatsapp" text;
ALTER TABLE "event_orders" ADD COLUMN IF NOT EXISTS "ticket_token" text;
CREATE UNIQUE INDEX IF NOT EXISTS "event_orders_ticket_token_uidx" ON "event_orders" ("ticket_token");

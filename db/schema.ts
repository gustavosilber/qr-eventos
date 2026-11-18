import { pgTable, text, timestamp, date } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Google sub
  name: text('name').notNull(),
  email: text('email').notNull(),
  picture: text('picture'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  location: text('location').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'),
  publicSlug: text('public_slug'),
  published: text('published').notNull().default('false'),
  coverImage: text('cover_image'),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const eventTiers = pgTable('event_tiers', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id),
  name: text('name').notNull(),
  priceCents: text('price_cents').notNull(), // store as string to avoid int size surprises; parse in app
  currency: text('currency').notNull(),
  quantity: text('quantity').notNull(), // available quantity
  sold: text('sold').notNull().default(sql`'0'`),
  salesStart: timestamp('sales_start', { withTimezone: true }),
  salesEnd: timestamp('sales_end', { withTimezone: true }),
  perBuyerLimit: text('per_buyer_limit'),
  visibility: text('visibility').notNull().default('public'),
  sortOrder: text('sort_order').notNull().default('0'),
  mpCheckoutUrl: text('mp_checkout_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const guestPasses = pgTable('guest_passes', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id),
  code: text('code').notNull(),
  issuedByUserId: text('issued_by_user_id')
    .notNull()
    .references(() => users.id),
  note: text('note'),
  beneficiaryName: text('beneficiary_name'),
  beneficiarySurname: text('beneficiary_surname'),
  assignedAt: timestamp('assigned_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  redeemed: text('redeemed').notNull().default(sql`'false'`),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const eventAttendees = pgTable('event_attendees', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id),
  fullName: text('full_name').notNull(),
  name: text('name'),
  surname: text('surname'),
  label: text('label'), // e.g., "Free Pass · Profesores"
  source: text('source').notNull().default('free_pass'),
  verified: text('verified').notNull().default(sql`'false'`),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const eventPaymentMethods = pgTable('event_payment_methods', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id),
  type: text('type').notNull(), // transfer | mercadopago | cash
  label: text('label').notNull(),
  config: text('config'), // JSON string
  enabled: text('enabled').notNull().default('true'),
  sortOrder: text('sort_order').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
})

export const eventOrders = pgTable('event_orders', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .notNull()
    .references(() => events.id),
  tierId: text('tier_id')
    .notNull()
    .references(() => eventTiers.id),
  buyerName: text('buyer_name').notNull(),
  buyerSurname: text('buyer_surname'),
  buyerEmail: text('buyer_email'),
  buyerDni: text('buyer_dni'),
  buyerWhatsapp: text('buyer_whatsapp'),
  paymentMethodId: text('payment_method_id'),
  paymentMethodType: text('payment_method_type').notNull(),
  status: text('status').notNull().default('pending_payment'),
  amountCents: text('amount_cents').notNull(),
  currency: text('currency').notNull(),
  referenceCode: text('reference_code'),
  ticketToken: text('ticket_token'),
  attendeeId: text('attendee_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
  paidAt: timestamp('paid_at', { withTimezone: true }),
})

export type InsertUser = {
  id: string
  name: string
  email: string
  picture?: string | null
}

export type InsertEvent = {
  id: string
  title: string
  date: string
  location: string
  description?: string | null
  status?: string
  ownerId: string
}

export type InsertEventTier = {
  id: string
  eventId: string
  name: string
  priceCents: string
  currency: string
  quantity: string
  perBuyerLimit?: string | null
  visibility?: string
  sortOrder?: string
  salesStart?: string | null
  salesEnd?: string | null
}

export type InsertGuestPass = {
  id: string
  eventId: string
  code: string
  issuedByUserId: string
  note?: string | null
  expiresAt?: string | null
}


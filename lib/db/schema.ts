import {
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// ---------------------------------------------------------------------------
// Schéma PostgreSQL (Neon) — billetterie Kin Pass
// Tables : users, events, ticket_types, tickets, scans
// ---------------------------------------------------------------------------

// Utilisateurs : organisateurs (créateurs d'événements) et agents de contrôle.
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    // 'organizer' | 'agent'
    role: varchar('role', { length: 20 }).notNull().default('organizer'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('users_email_idx').on(table.email)],
)

// Événements créés par un organisateur.
export const events = pgTable(
  'events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizerId: uuid('organizer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    // Concert | Conférence | Mariage | Soirée privée
    category: varchar('category', { length: 50 }),
    venue: varchar('venue', { length: 255 }),
    location: varchar('location', { length: 255 }),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    posterUrl: text('poster_url'),
    // draft | published | finished
    status: varchar('status', { length: 20 }).notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('events_slug_idx').on(table.slug),
    index('events_organizer_idx').on(table.organizerId),
  ],
)

// Types de billets d'un événement (ex : Standard 10 $, VIP 30 $, Invitation gratuite).
export const ticketTypes = pgTable(
  'ticket_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull().default('0'),
    // USD | CDF
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    capacity: integer('capacity'),
    soldCount: integer('sold_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('ticket_types_event_idx').on(table.eventId)],
)

// Billets achetés. `code` = code alphanumérique unique de 6 caractères (indexé UNIQUE).
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id, { onDelete: 'cascade' }),
    buyerName: varchar('buyer_name', { length: 255 }).notNull(),
    buyerPhone: varchar('buyer_phone', { length: 30 }),
    buyerEmail: varchar('buyer_email', { length: 255 }),
    code: varchar('code', { length: 10 }).notNull(),
    // valid | used | cancelled
    status: varchar('status', { length: 20 }).notNull().default('valid'),
    scannedAt: timestamp('scanned_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('tickets_code_idx').on(table.code),
    index('tickets_event_idx').on(table.eventId),
    index('tickets_ticket_type_idx').on(table.ticketTypeId),
  ],
)

// Journal des scans à l'entrée de l'événement.
export const scans = pgTable(
  'scans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    agentId: uuid('agent_id').references(() => users.id, { onDelete: 'set null' }),
    // valid | used | invalid
    result: varchar('result', { length: 20 }).notNull(),
    scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('scans_ticket_idx').on(table.ticketId),
    index('scans_event_idx').on(table.eventId),
  ],
)

// Types exportés pour un typage strict côté application.
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Event = typeof events.$inferSelect
export type NewEvent = typeof events.$inferInsert
export type TicketType = typeof ticketTypes.$inferSelect
export type NewTicketType = typeof ticketTypes.$inferInsert
export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
export type Scan = typeof scans.$inferSelect
export type NewScan = typeof scans.$inferInsert

import {
  boolean,
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
// Schéma PostgreSQL (Neon) — billetterie kinPass
// Tables : users, payout_methods, events, event_images, ticket_types, orders,
//          order_items, tickets, scans
// ---------------------------------------------------------------------------

// Utilisateurs : organisateurs (créateurs d'événements) et agents de contrôle.
// Auth.js : `provider`/`providerId` distinguent email/password et Google ;
// `passwordHash` est nullable (compte Google pur sans mot de passe).
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Slug public de l'organisateur (route `/o/[slug]`, Phase 9.5) : généré à
    // l'inscription depuis le nom complet (unique, suffixé si collision).
    slug: varchar('slug', { length: 255 }).unique(),
    passwordHash: text('password_hash'),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    // 'organizer' | 'agent' | 'superadmin'
    role: varchar('role', { length: 20 }).notNull().default('organizer'),
    // 'email' | 'google' — Auth.js (cf. plan §4.2)
    provider: varchar('provider', { length: 20 }).notNull().default('email'),
    // Identifiant auprès du provider (ex. sub Google) — NULL pour email/password.
    providerId: varchar('provider_id', { length: 255 }),
    // Profil organisateur (Phase 4.3) — avatar (URL, alimenté par Google),
    // téléphone WhatsApp et adresse.
    avatarUrl: text('avatar_url'),
    phoneWhatsapp: varchar('phone_whatsapp', { length: 30 }),
    address: varchar('address', { length: 255 }),
    // Présence « grandes compagnies » : bio courte, site web, réseau social.
    bio: text('bio'),
    website: varchar('website', { length: 255 }),
    instagram: varchar('instagram', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email),
    uniqueIndex('users_provider_idx').on(table.provider, table.providerId),
  ],
)

// Comptes de reversement de l'organisateur (Phase 4.3) : où kinPass envoie
// les revenus lors d'un retrait (Phase 10). 1 à N méthodes par organisateur.
export const payoutMethods = pgTable(
  'payout_methods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // 'mpesa' | 'airtel_money' | 'orange_money' | 'bank'
    provider: varchar('provider', { length: 20 }).notNull(),
    // Titulaire du compte (nom complet).
    accountName: varchar('account_name', { length: 100 }).notNull(),
    // Numéro Mobile Money ou IBAN selon le provider.
    accountNumber: varchar('account_number', { length: 50 }).notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('payout_methods_user_idx').on(table.userId)],
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
    // Concert | Conférence | Festival | Soirée privée | Autre
    category: varchar('category', { length: 50 }),
    // Type d'événement personnalisé, renseigné si `category === 'Autre'`.
    categoryCustom: varchar('category_custom', { length: 100 }),
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

// Galerie de photos descriptives d'un événement (Phase 6.1) : 1 à 3 images
// URL au MVP (l'upload réel arrivera avec le stockage externe). `position`
// pilote l'ordre d'affichage côté public ; `posterUrl` reste la « une ».
export const eventImages = pgTable(
  'event_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    // Texte alternatif (accessibilité, SEO) — optionnel au MVP.
    alt: varchar('alt', { length: 255 }),
    // Ordre d'affichage dans la galerie (0 = première).
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('event_images_event_idx').on(table.eventId)],
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

// Commandes d'achat (Phase 6.2) : un acheteur groupe ses achats en une
// commande (1 à N types de billets via `order_items`). Le paiement n'est pas
// encore effectué à la création : statut `pending` → `paid` à la confirmation
// Mobile Money (webhook, Phase 6.4), puis les billets sont générés.
export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    buyerName: varchar('buyer_name', { length: 255 }).notNull(),
    // Téléphone Mobile Money de l'acheteur (format international libre).
    buyerPhone: varchar('buyer_phone', { length: 30 }),
    buyerEmail: varchar('buyer_email', { length: 255 }),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    // USD | CDF — devise du total (celle du type de billet commandé).
    currency: varchar('currency', { length: 10 }).notNull().default('USD'),
    // email | download — choisi à l'achat (Phase 6.3), téléchargement par défaut.
    deliveryMethod: varchar('delivery_method', { length: 20 }).notNull().default('download'),
    // pending | paid | failed | expired (expiration après X minutes, Phase 6.4).
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    // Référence de paiement renvoyée par l'agrégateur Mobile Money (webhook).
    paymentRef: varchar('payment_ref', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('orders_event_idx').on(table.eventId),
    index('orders_status_idx').on(table.status),
  ],
)

// Lignes d'une commande : quantité × prix unitaire (gelé à l'achat) d'un type
// de billet. Regroupement des achats multi-billets d'un même commanditaire.
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    ticketTypeId: uuid('ticket_type_id')
      .notNull()
      .references(() => ticketTypes.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    // Prix unitaire au moment de l'achat (les tarifs peuvent changer après).
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  },
  (table) => [index('order_items_order_idx').on(table.orderId)],
)

// Billets achetés. `code` = code alphanumérique unique de 6 caractères (indexé UNIQUE).
// `orderId` rattache un billet à sa commande (Phase 6.2 ; nullable pour les
// billets seedés avant les commandes).
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
    // Lien vers la commande d'achat (nullable : billets du seed antérieurs).
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
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
export type EventImage = typeof eventImages.$inferSelect
export type NewEventImage = typeof eventImages.$inferInsert
export type TicketType = typeof ticketTypes.$inferSelect
export type NewTicketType = typeof ticketTypes.$inferInsert
export type Ticket = typeof tickets.$inferSelect
export type NewTicket = typeof tickets.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert
export type Scan = typeof scans.$inferSelect
export type NewScan = typeof scans.$inferInsert
export type PayoutMethod = typeof payoutMethods.$inferSelect

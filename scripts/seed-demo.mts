// ────────────────────────────────────────────────────────────────────────────
// Seed de démonstration — kinPass (Phase 5 + auth Phase 4.1)
//
// Crée l'organisateur de test (UUID fixe, voir `lib/constants.ts`) avec un
// mot de passe réel (auth activée) puis, si la base est vide, un événement
// publié avec des billets vendus et scannés pour alimenter le tableau de
// bord. Idempotent : peut être relancé sans risque.
//
// Identifiants de démonstration :
//   email    : organisateur@kinpass.test
//   password : Demo@2026
//
// Exécution :
//   node scripts/seed-demo.mts          (ajoute uniquement si la base est vide)
//   node scripts/seed-demo.mts --reset  (supprime les données démo puis re-seed)
// ────────────────────────────────────────────────────────────────────────────

import { config } from 'dotenv'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'

import { events, scans, tickets, ticketTypes, users } from '../lib/db/schema.ts'
import { DEFAULT_ORGANIZER_ID } from '../lib/constants.ts'

config({ path: '.env.local' })

const RESET = process.argv.includes('--reset')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL est manquante. Ajoutez-la dans .env.local.')
  process.exit(1)
}

const client = postgres(process.env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

// Mot de passe de démonstration (connu, à usage local uniquement).
const DEMO_PASSWORD = 'Demo@2026'

// 1) Organisateur de test (met à jour le mot de passe s'il existait sans hash).
await db
  .insert(users)
  .values({
    id: DEFAULT_ORGANIZER_ID,
    email: 'organisateur@kinpass.test',
    passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10),
    fullName: 'Organisateur de test',
  })
  .onConflictDoUpdate({
    target: users.id,
    set: { passwordHash: bcrypt.hashSync(DEMO_PASSWORD, 10) },
  })
console.log('✓ Organisateur de test prêt (organisateur@kinpass.test / Demo@2026).')

// 2) Option --reset : suppression complète des données de l'organisateur
// (les événements entraînent leurs ticket_types/tickets/scans en cascade).
if (RESET) {
  await db.delete(events).where(eq(events.organizerId, DEFAULT_ORGANIZER_ID))
  console.log('✓ Données démo supprimées (--reset).')
}

// 3) Données de démonstration, uniquement si aucun événement n'existe encore.
const existing = await db.select({ id: events.id }).from(events).limit(1)
if (existing.length > 0) {
  console.log('ℹ Base déjà alimentée, aucune donnée de démo ajoutée.')
  await client.end()
  process.exit(0)
}

// Helpers de codes de billets (6 caractères alphanumériques uniques).
const usedCodes = new Set<string>()
function makeCode(index: number): string {
  const code = `KP${String(index).padStart(4, '0')}`
  usedCodes.add(code)
  return code
}

await db.transaction(async (tx) => {
  // ── Événement 1 : publié, avec des ventes et des scans ────────────────────
  const [houseEvent] = await tx
    .insert(events)
    .values({
      organizerId: DEFAULT_ORGANIZER_ID,
      title: 'Kin House : Open Studio',
      slug: 'kin-house-open-studio',
      description:
        'Une journée portes ouvertes dans les ateliers d’artistes de Kinshasa : peinture, sculpture, musique live et rencontre avec les créateurs.',
      category: 'Concert',
      venue: 'Galerie d’art moderne',
      location: 'Kinshasa, Gombe',
      startAt: new Date('2026-09-20T18:00:00'),
      endAt: new Date('2026-09-20T23:00:00'),
      posterUrl: null,
      status: 'published',
    })
    .returning()

  const [standard] = await tx
    .insert(ticketTypes)
    .values({ eventId: houseEvent.id, name: 'Standard', price: '10.00', currency: 'USD', capacity: 300, soldCount: 10 })
    .returning()
  const [vip] = await tx
    .insert(ticketTypes)
    .values({ eventId: houseEvent.id, name: 'VIP', price: '50.00', currency: 'USD', capacity: 50, soldCount: 2 })
    .returning()

  // 10 billets Standard (8 déjà utilisés/scannés, 2 valides) + 2 billets VIP.
  const houseTickets = [
    ...Array.from({ length: 8 }, (_, i) => ({
      typeId: standard.id,
      status: 'used' as const,
      scanned: new Date('2026-09-20T18:12:00'),
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      typeId: standard.id,
      status: 'valid' as const,
      scanned: null,
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      typeId: vip.id,
      status: 'used' as const,
      scanned: new Date('2026-09-20T18:20:00'),
    })),
  ]

  let codeIndex = 1
  for (let i = 0; i < houseTickets.length; i++) {
    const t = houseTickets[i]
    const [ticket] = await tx
      .insert(tickets)
      .values({
        eventId: houseEvent.id,
        ticketTypeId: t.typeId,
        buyerName: `Participant démo ${i + 1}`,
        buyerPhone: '+243 820 000 0' + ((i % 9) + 1),
        buyerEmail: `participant${i + 1}@exemple.cd`,
        code: makeCode(codeIndex++),
        status: t.status,
        scannedAt: t.scanned,
      })
      .returning()

    // Les billets « used » ont été scannés à l'entrée (journal des scans).
    if (t.status === 'used' && t.scanned) {
      await tx.insert(scans).values({
        ticketId: ticket.id,
        eventId: houseEvent.id,
        agentId: null,
        result: 'valid',
        scannedAt: t.scanned,
      })
    }
  }

  // ── Événement 2 : brouillon, sans vente (test du flux publication) ────────
  const [draftEvent] = await tx
    .insert(events)
    .values({
      organizerId: DEFAULT_ORGANIZER_ID,
      title: 'Conférence Tech RDC',
      slug: 'conference-tech-rdc',
      description: 'Deux jours de conférences sur la transformation numérique en RDC.',
      category: 'Conférence',
      venue: 'Pullman Kinshasa',
      location: 'Kinshasa, Gombe',
      startAt: new Date('2026-10-03T09:00:00'),
      endAt: new Date('2026-10-03T18:00:00'),
      posterUrl: null,
      status: 'draft',
    })
    .returning()

  await tx.insert(ticketTypes).values({
    eventId: draftEvent.id,
    name: 'Passe journée',
    price: '25.00',
    currency: 'USD',
    capacity: 300,
    soldCount: 0,
  })

  console.log('✓ Données de démonstration créées (2 événements, 12 billets, 10 scans).')
})

await client.end()

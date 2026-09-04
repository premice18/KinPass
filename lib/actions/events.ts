'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Gestion des événements (Phase 5, sécurisée en Phase 4)
//
// CRUD complet des événements avec leurs types de billets, persistance en base
// (Neon PostgreSQL via Drizzle), validation Zod (messages en français,
// schémas dans `lib/validators/events.ts`), génération de slug unique et
// transactions atomiques.
//
// SÉCURISATION (Phase 4.1) : l'organisateur est l'utilisateur de session
// (`getCurrentUser`). Chaque action exige une session valide et vérifie la
// propriété de la ressource (défense en profondeur, en complément du
// middleware).
//
// NB : un fichier "use server" ne peut exporter que des fonctions async et des
// types ; les schémas Zod vivent donc dans `lib/validators/events.ts`.
// ────────────────────────────────────────────────────────────────────────────

import { and, desc, eq, inArray, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { events, payoutMethods, scans, ticketTypes, tickets, type Event, type TicketType, type User } from '@/lib/db/schema'
import type { EventStatus } from '@/lib/constants'
import { getCurrentUser } from '@/lib/auth'
import { randomSuffix, slugify } from '@/lib/slug'
import {
  createEventSchema,
  firstZodErrorMessage,
  updateEventSchema,
  type CreateEventInput,
  type TicketTypeInput,
  type UpdateEventInput,
} from '@/lib/validators/events'

// ── Types utilitaires exportés ───────────────────────────────────────────────

// Résultat standard renvoyé par les Server Actions : succès avec données, ou
// échec avec un message d'erreur affichable directement dans l'interface.
export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// Événement enrichi de ses statistiques calculées pour le tableau de bord.
export type EventWithStats = Event & {
  ticketTypes: TicketType[]
  soldCount: number // billets vendus (statut valid/used)
  capacity: number | null // capacité totale (somme des capacités des types)
  fillRate: number // taux de remplissage, 0 à 100
  revenueUSD: number // chiffre d'affaires en USD
  revenueCDF: number // chiffre d'affaires en CDF
  scannedCount: number // personnes entrées (scans valides)
}

// Événement complet avec ses types de billets (utilisé pour pré-remplir le
// formulaire en mode édition).
export type EditableEvent = Event & { ticketTypes: TicketType[] }

// ── Helpers internes ─────────────────────────────────────────────────────────

// Message renvoyé quand l'utilisateur n'est pas connecté (le dashboard
// l'affiche avec une invitation à se connecter). NB : const interne — un
// fichier "use server" ne peut exporter que des fonctions async et des types.
const LOGIN_REQUIRED_ERROR = 'Connexion requise pour accéder à vos événements.'

// Retourne l'organisateur de session (rôle `organizer`), ou `null`.
async function getSessionOrganizer(): Promise<User | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') return null
  return user
}

// Génère un slug unique à partir du titre : slugify(titre), puis ajout d'un
// suffixe aléatoire si ce slug existe déjà (3 tentatives, repli garanti).
//
// `executor` permet d'utiliser le client de transaction quand la fonction est
// appelée DANS une transaction : avec un pool de connexion `max: 1` (voir
// `lib/db/index.ts`), passer par le client global provoquerait un blocage.
async function generateUniqueSlug(
  title: string,
  executor: Pick<typeof db, 'select'> = db,
): Promise<string> {
  const base = slugify(title)
  for (let attempt = 0; attempt < 3; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`
    const existing = await executor
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, candidate))
      .limit(1)
    if (existing.length === 0) return candidate
  }
  return `${base}-${randomSuffix()}`
}

// Convertit un type de billet validé (Zod) en ligne d'insertion Drizzle.
// Note : `price` est converti en chaîne car la colonne est de type numeric.
function toTicketTypeRow(t: TicketTypeInput, eventId: string) {
  return {
    eventId,
    name: t.name,
    price: String(t.price),
    currency: t.currency,
    capacity: t.capacity ?? null,
  }
}

// Change le statut d'un événement (draft → published → finished).
// Session + propriété obligatoires. Publication bloquée tant que
// l'organisateur n'a pas configuré de compte de reversement (Phase 4.3/10).
async function setEventStatus(eventId: string, status: EventStatus): Promise<ActionResult<Event>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

  try {
    if (status === 'published') {
      const payout = await db
        .select({ id: payoutMethods.id })
        .from(payoutMethods)
        .where(eq(payoutMethods.userId, organizer.id))
        .limit(1)
      if (payout.length === 0) {
        return {
          success: false,
          error: 'Ajoutez un compte de reversement dans vos réglages pour publier un événement.',
        }
      }
    }

    const [owned] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!owned) return { success: false, error: 'Action non autorisée.' }

    const [updated] = await db
      .update(events)
      .set({ status, updatedAt: new Date() })
      .where(eq(events.id, eventId))
      .returning()
    if (!updated) return { success: false, error: 'Événement introuvable.' }
    return { success: true, data: updated }
  } catch {
    return { success: false, error: "Impossible de modifier le statut de l'événement." }
  }
}

// ── Server Actions exportées ─────────────────────────────────────────────────

// Crée un événement (statut `draft`) et ses types de billets de manière
// atomique (transaction) : si une insertion échoue, rien n'est persisté.
export async function createEvent(input: CreateEventInput): Promise<ActionResult<Event>> {
  const parsed = createEventSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  try {
    // Session obligatoire : l'événement appartient à l'organisateur connecté.
    const organizer = await getSessionOrganizer()
    if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

    const slug = await generateUniqueSlug(data.title)
    const now = new Date()

    const event = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(events)
        .values({
          organizerId: organizer.id,
          title: data.title,
          slug,
          description: data.description || null,
          category: data.category || null,
          // Type personnalisé : uniquement si la catégorie est « Autre ».
          categoryCustom: data.category === 'Autre' ? data.categoryCustom || null : null,
          venue: data.venue || null,
          location: data.location || null,
          startAt: data.startAt ?? null,
          endAt: data.endAt ?? null,
          posterUrl: data.posterUrl || null,
          status: 'draft',
          updatedAt: now,
        })
        .returning()

      await tx.insert(ticketTypes).values(data.ticketTypes.map((t) => toTicketTypeRow(t, created.id)))
      return created
    })

    return { success: true, data: event }
  } catch {
    return { success: false, error: "Impossible de créer l'événement. Réessayez." }
  }
}

// Met à jour les informations générales d'un événement. Si `ticketTypes` est
// fourni, les types existants sont REMPLACÉS intégralement (suppression puis
// réinsertion) — c'est la méthode la plus simple pour le MVP. Règle de
// sécurité : le remplacement est refusé si un type a déjà des billets vendus
// (la suppression des types supprimerait tickets et scans en cascade).
export async function updateEvent(eventId: string, input: UpdateEventInput): Promise<ActionResult<Event>> {
  const parsed = updateEventSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  try {
    const organizer = await getSessionOrganizer()
    if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

    const [existing] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!existing) return { success: false, error: 'Événement introuvable.' }

    return await db.transaction(async (tx) => {
      // Remplacement complet des types de billets si le formulaire les fournit.
      if (data.ticketTypes) {
        const types = await tx
          .select({ soldCount: ticketTypes.soldCount })
          .from(ticketTypes)
          .where(eq(ticketTypes.eventId, eventId))
        const hasSales = types.some((t) => t.soldCount > 0)
        if (hasSales) {
          throw new Error('Impossible de modifier les billets : des billets ont déjà été vendus.')
        }
        await tx.delete(ticketTypes).where(eq(ticketTypes.eventId, eventId))
        await tx.insert(ticketTypes).values(data.ticketTypes.map((t) => toTicketTypeRow(t, eventId)))
      }

      // Mise à jour des informations générales (seuls les champs fournis
      // sont modifiés ; le slug est régénéré si le titre change).
      const rows = await tx
        .update(events)
        .set({
          title: data.title ?? existing.title,
          slug: data.title ? await generateUniqueSlug(data.title, tx) : existing.slug,
          description: data.description !== undefined ? data.description || null : existing.description,
          category: data.category !== undefined ? data.category || null : existing.category,
          // Le type personnalisé n'est conservé que si la catégorie est « Autre ».
          categoryCustom:
            data.categoryCustom !== undefined
              ? (data.category === 'Autre' ? data.categoryCustom || null : null)
              : existing.categoryCustom,
          venue: data.venue !== undefined ? data.venue || null : existing.venue,
          location: data.location !== undefined ? data.location || null : existing.location,
          startAt: data.startAt !== undefined ? data.startAt : existing.startAt,
          endAt: data.endAt !== undefined ? data.endAt : existing.endAt,
          posterUrl: data.posterUrl !== undefined ? data.posterUrl || null : existing.posterUrl,
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId))
        .returning()

      if (rows.length === 0) return { success: false, error: 'Événement introuvable.' }
      // Assertion : Drizzle élargit les types de colonnes à `string` dès que
      // `.set()` reçoit des valeurs mixtes ; la ligne correspond bien à `Event`.
      return { success: true, data: rows[0] as Event }
    })
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Impossible de mettre à jour l'événement.",
    }
  }
}

// Supprime un événement et toutes ses dépendances (ticket_types, tickets,
// scans) grâce aux contraintes ON DELETE CASCADE du schéma.
// Session + propriété obligatoires.
export async function deleteEvent(eventId: string): Promise<ActionResult<{ id: string }>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

  try {
    await db.delete(events).where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
    return { success: true, data: { id: eventId } }
  } catch {
    return { success: false, error: "Impossible de supprimer l'événement." }
  }
}

// Passe un événement au statut « publié » (visible publiquement).
export async function publishEvent(eventId: string): Promise<ActionResult<Event>> {
  return setEventStatus(eventId, 'published')
}

// Marque un événement comme « terminé » (fin de la billetterie et des ventes).
export async function finishEvent(eventId: string): Promise<ActionResult<Event>> {
  return setEventStatus(eventId, 'finished')
}

// ── Aggrégation partagée ─────────────────────────────────────────────────────

// Calcule les statistiques (ventes, revenus par devise, scans, capacité) pour
// une liste d'événements. Utilisé par `getOrganizerEvents` (tous les
// événements) et `getEventDetail` (un seul événement).
async function attachStats(eventsList: Event[]): Promise<EventWithStats[]> {
  if (eventsList.length === 0) return []

  const eventIds = eventsList.map((e) => e.id)

  // Types de billets de tous les événements (une seule requête groupée).
  const types = await db.select().from(ticketTypes).where(inArray(ticketTypes.eventId, eventIds))

  // Billets vendus par événement (les billets annulés ne comptent pas).
  const soldRows = await db
    .select({ eventId: tickets.eventId, count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(and(inArray(tickets.eventId, eventIds), inArray(tickets.status, ['valid', 'used'])))
    .groupBy(tickets.eventId)

  // Revenus par événement et par devise : chaque billet vendu contribue une
  // fois le prix de son type (jointure tickets → ticket_types).
  const revenueRows = await db
    .select({
      eventId: tickets.eventId,
      currency: ticketTypes.currency,
      total: sql<number>`coalesce(sum(${ticketTypes.price}), 0)::float8`,
    })
    .from(tickets)
    .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
    .where(and(inArray(tickets.eventId, eventIds), inArray(tickets.status, ['valid', 'used'])))
    .groupBy(tickets.eventId, ticketTypes.currency)

  // Personnes entrées : scans enregistrés avec un résultat valide.
  const scanRows = await db
    .select({ eventId: scans.eventId, count: sql<number>`count(*)::int` })
    .from(scans)
    .where(and(inArray(scans.eventId, eventIds), inArray(scans.result, ['valid', 'used'])))
    .groupBy(scans.eventId)

  // Indexation des résultats en mémoire pour l'assemblage final.
  const soldByEvent = new Map(soldRows.map((r) => [r.eventId, r.count]))
  const scannedByEvent = new Map(scanRows.map((r) => [r.eventId, r.count]))
  const revenueByEvent = new Map<string, Partial<Record<'USD' | 'CDF', number>>>()
  for (const row of revenueRows) {
    const current = revenueByEvent.get(row.eventId) ?? {}
    current[row.currency as 'USD' | 'CDF'] = Number(row.total)
    revenueByEvent.set(row.eventId, current)
  }
  const typesByEvent = new Map<string, TicketType[]>()
  for (const type of types) {
    const list = typesByEvent.get(type.eventId) ?? []
    list.push(type)
    typesByEvent.set(type.eventId, list)
  }

  return eventsList.map((event) => {
    const eventTypes = typesByEvent.get(event.id) ?? []
    const capacity = eventTypes.reduce((sum, t) => sum + (t.capacity ?? 0), 0)
    const soldCount = soldByEvent.get(event.id) ?? 0
    const revenue = revenueByEvent.get(event.id) ?? {}
    return {
      ...event,
      ticketTypes: eventTypes,
      soldCount,
      capacity: capacity || null,
      fillRate: capacity > 0 ? Math.min(100, Math.round((soldCount / capacity) * 100)) : 0,
      revenueUSD: revenue.USD ?? 0,
      revenueCDF: revenue.CDF ?? 0,
      scannedCount: scannedByEvent.get(event.id) ?? 0,
    }
  })
}

// Liste les événements de l'organisateur avec leurs statistiques calculées en
// base (agrégations Drizzle) : ventes, revenus par devise, scans valides.
// L'agrégation en SQL évite de charger toutes les lignes tickets/scans.
export async function getOrganizerEvents(): Promise<ActionResult<EventWithStats[]>> {
  try {
    const organizer = await getSessionOrganizer()
    if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

    const eventsList = await db
      .select()
      .from(events)
      .where(eq(events.organizerId, organizer.id))
      .orderBy(desc(events.createdAt))

    const withStats = await attachStats(eventsList)
    return { success: true, data: withStats }
  } catch {
    return { success: false, error: 'Impossible de charger vos événements.' }
  }
}

// Retourne un événement complet avec ses types de billets (mode édition).
// Session + propriété obligatoires (on ne peut éditer que ses événements).
export async function getEventById(eventId: string): Promise<ActionResult<EditableEvent>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

  try {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!event) return { success: false, error: 'Événement introuvable.' }

    const eventTypes = await db
      .select()
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, eventId))
      .orderBy(ticketTypes.createdAt)
    return { success: true, data: { ...event, ticketTypes: eventTypes } }
  } catch {
    return { success: false, error: "Impossible de charger l'événement." }
  }
}

// ── Vue détail d'un événement ────────────────────────────────────────────────

// Billet résumé affiché dans la vue détail (sans données sensibles inutiles).
export type EventDetailTicket = {
  id: string
  code: string
  buyerName: string
  status: string
  typeName: string
  createdAt: Date
}

// Détail complet d'un événement : statistiques (mêmes calculs que la liste),
// vente par type de billet, et billets récents (25 derniers).
// Session + propriété obligatoires.
export async function getEventDetail(
  eventId: string,
): Promise<ActionResult<{ event: EventWithStats; tickets: EventDetailTicket[] }>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: LOGIN_REQUIRED_ERROR }

  try {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!event) return { success: false, error: 'Événement introuvable.' }

    const [withStats] = await attachStats([event])

    // 25 derniers billets, avec le nom de leur type (jointure).
    const recentTickets = await db
      .select({
        id: tickets.id,
        code: tickets.code,
        buyerName: tickets.buyerName,
        status: tickets.status,
        typeName: ticketTypes.name,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
      .where(eq(tickets.eventId, eventId))
      .orderBy(desc(tickets.createdAt))
      .limit(25)

    return { success: true, data: { event: withStats, tickets: recentTickets } }
  } catch {
    return { success: false, error: "Impossible de charger le détail de l'événement." }
  }
}

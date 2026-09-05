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

import { cache } from 'react'
import { and, asc, desc, eq, ilike, inArray, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import {
  eventImages,
  events,
  payoutMethods,
  scans,
  ticketTypes,
  tickets,
  users,
  type Event,
  type EventImage,
  type TicketType,
  type User,
} from '@/lib/db/schema'
import type { EventCategory, EventStatus } from '@/lib/constants'
import { getCurrentUser } from '@/lib/auth'
import { randomSuffix, slugify } from '@/lib/slug'
import {
  createEventSchema,
  firstZodErrorMessage,
  updateEventSchema,
  type CreateEventInput,
  type EventImageInput,
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

// Événement complet avec ses types de billets et sa galerie (utilisé pour
// pré-remplir le formulaire en mode édition).
export type EditableEvent = Event & { ticketTypes: TicketType[]; eventImages: EventImage[] }

// ── Données publiques de la page événement (Phase 6.1) ──────────────────────

// Photo de la galerie exposée publiquement (champs strictement publics).
export type PublicEventImage = { id: string; url: string; alt: string | null }

// Type de billet exposé publiquement : tarif + disponibilité réelle
// (capacité et ventes depuis la colonne `sold_count` — jauge de l'achat).
export type PublicTicketType = {
  id: string
  name: string
  price: string
  currency: string
  capacity: number | null
  soldCount: number
}

// Événement public (route `/e/[slug]`) : champs marketing uniquement —
// aucun identifiant interne sensible (organizer_id, sold_count par type…).
export type PublicEvent = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
  categoryCustom: string | null
  venue: string | null
  location: string | null
  startAt: Date | null
  endAt: Date | null
  posterUrl: string | null
  status: EventStatus
  ticketTypes: PublicTicketType[]
  images: PublicEventImage[]
  // Organisateur (page publique `/o/[slug]`, Phase 9.5) — `null` si le
  // compte n'a pas encore de slug (comptes créés avant la Phase 9.5).
  organizerName: string | null
  organizerSlug: string | null
}

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

// Convertit une photo de galerie validée (Zod) en ligne d'insertion Drizzle.
// `position` = index dans le tableau reçu (ordre d'affichage côté public).
function toEventImageRow(image: EventImageInput, eventId: string, position: number) {
  return {
    eventId,
    url: image.url,
    alt: image.alt?.trim() || null,
    position,
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

      // Galerie de photos (optionnelle au MVP : URLs hébergées ailleurs).
      if (data.eventImages && data.eventImages.length > 0) {
        await tx
          .insert(eventImages)
          .values(data.eventImages.map((image, index) => toEventImageRow(image, created.id, index)))
      }
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

      // Galerie : remplacement intégral si le formulaire la fournit (simplifié
      // au MVP, comme les types de billets) — les photos n'ont pas d'historique
      // sensible, le remplacement est sans risque même après des ventes.
      if (data.eventImages !== undefined) {
        await tx.delete(eventImages).where(eq(eventImages.eventId, eventId))
        if (data.eventImages.length > 0) {
          await tx
            .insert(eventImages)
            .values(data.eventImages.map((image, index) => toEventImageRow(image, eventId, index)))
        }
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

    // Galerie du formulaire (mode édition), dans l'ordre d'affichage.
    const eventImagesList = await db
      .select()
      .from(eventImages)
      .where(eq(eventImages.eventId, eventId))
      .orderBy(asc(eventImages.position))
    return { success: true, data: { ...event, ticketTypes: eventTypes, eventImages: eventImagesList } }
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

// ── Page publique événement (Phase 6.1) ─────────────────────────────────────

// Charge un événement PUBLIÉ (ou terminé) par son slug, avec ses tarifs et sa
// galerie — AUCUNE session requise (route publique `/e/[slug]`).
//
// Sécurité : seuls les champs marketing sont exposés ; les brouillons et les
// événements inconnus renvoient une erreur (la route appelle alors `notFound`).
// `react cache()` dé-duplique l'appel entre `generateMetadata` et la page
// pendant le même rendu serveur (une seule requête base au total).
export const getPublicEventBySlug = cache(async (slug: string): Promise<ActionResult<PublicEvent> | null> => {
  try {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.slug, slug), inArray(events.status, ['published', 'finished'])))
      .limit(1)
    if (!event) return { success: false, error: 'Événement introuvable.' }

    // Tarifs affichés sur la page (prix par type, triés par ordre de création).
    const types = await db
      .select({
        id: ticketTypes.id,
        name: ticketTypes.name,
        price: ticketTypes.price,
        currency: ticketTypes.currency,
        capacity: ticketTypes.capacity,
        soldCount: ticketTypes.soldCount,
      })
      .from(ticketTypes)
      .where(eq(ticketTypes.eventId, event.id))
      .orderBy(ticketTypes.createdAt)

    // Galerie de photos, dans l'ordre d'affichage (position).
    const images = await db
      .select({ id: eventImages.id, url: eventImages.url, alt: eventImages.alt })
      .from(eventImages)
      .where(eq(eventImages.eventId, event.id))
      .orderBy(asc(eventImages.position))

    // Organisateur : nom + slug public (lien vers `/o/[slug]`, Phase 9.5).
    const [organizer] = await db
      .select({ fullName: users.fullName, slug: users.slug })
      .from(users)
      .where(eq(users.id, event.organizerId))
      .limit(1)

    return {
      success: true,
      data: {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description,
        category: event.category,
        categoryCustom: event.categoryCustom,
        venue: event.venue,
        location: event.location,
        startAt: event.startAt,
        endAt: event.endAt,
        posterUrl: event.posterUrl,
        status: event.status as EventStatus,
        ticketTypes: types.map((t) => ({
          id: t.id,
          name: t.name,
          price: t.price,
          currency: t.currency,
          capacity: t.capacity,
          soldCount: t.soldCount,
        })),
        images: images.map((image) => ({ id: image.id, url: image.url, alt: image.alt })),
        organizerName: organizer?.fullName ?? null,
        organizerSlug: organizer?.slug ?? null,
      },
    }
  } catch {
    return { success: false, error: 'Événement introuvable.' }
  }
})

// ── Vitrine publique des événements (Phase 9) ───────────────────────────────

// Carte d'événement « talon » de la vitrine (landing + listing) — type partagé
// consommé par les deux. Anti-abus : aucune place « inventée » — la
// disponibilité n'est jamais affichée, seul « Complet » est calculé sur les
// données réelles (soldCount >= capacité totale).
export type PublicEventCard = {
  id: string
  slug: string
  title: string
  category: string | null
  categoryCustom: string | null
  venue: string | null
  location: string | null
  startAt: Date | null
  endAt: Date | null
  posterUrl: string | null
  // Prix minimum parmi les types PAYANTS (null si aucun type payant).
  minPrice: number | null
  // Devise du prix minimum affiché.
  minPriceCurrency: 'USD' | 'CDF' | null
  // Vrai si TOUS les types sont à 0 (événement gratuit → « Entrée libre »).
  isFree: boolean
  // Capacité totale réelle (somme des capacités) — null si aucune définie.
  capacity: number | null
  // Billets réellement vendus (statuts valid/used), agrégés depuis `tickets`.
  soldCount: number
  // Vrai si capacité définie ET atteinte (jauge pleine).
  isSoldOut: boolean
  // Organisateur (nom + slug public — lien `/o/[slug]`, Phase 9.5).
  organizerName: string | null
  organizerSlug: string | null
}

// Options de filtrage du loader partagé (utilisé par la landing, le listing
// et la page publique organisateur).
export type PublicEventsQuery = {
  category?: EventCategory
  search?: string
  // Nombre maximal d'événements (bandeau de la landing : 3-4).
  limit?: number
  // Restriction à un organisateur (page `/o/[slug]`).
  organizerId?: string
}

// Charge les événements PUBLIÉS à venir ou en cours, triés par date croissante.
// Uniquement `status = 'published'` — jamais de brouillons/terminés (règle
// d'affichage de la vitrine, cf. plan §4.9).
export async function loadPublicEventCards(query: PublicEventsQuery = {}): Promise<PublicEventCard[]> {
  const { category, search, limit, organizerId } = query

  // Date filtre : événements pas encore passés (en cours inclus) — un
  // événement sans date reste visible (coalesce sur la date de début).
  const whereClauses: ReturnType<typeof eq>[] = [eq(events.status, 'published')]
  if (category) whereClauses.push(eq(events.category, category))
  if (search) whereClauses.push(ilike(events.title, `%${search.trim()}%`))
  if (organizerId) whereClauses.push(eq(events.organizerId, organizerId))

  const rows = await db
    .select({
      event: events,
      organizerName: users.fullName,
      organizerSlug: users.slug,
    })
    .from(events)
    .innerJoin(users, eq(events.organizerId, users.id))
    .where(and(sql`coalesce(${events.endAt}, ${events.startAt}) >= now()`, ...whereClauses))
    .orderBy(asc(events.startAt), asc(events.createdAt))
    .limit(limit ?? 100)

  const eventIds = rows.map((row) => row.event.id)
  if (eventIds.length === 0) return []

  // Types de billets de tous les événements (une seule requête groupée).
  const types = await db
    .select({
      eventId: ticketTypes.eventId,
      name: ticketTypes.name,
      price: ticketTypes.price,
      currency: ticketTypes.currency,
      capacity: ticketTypes.capacity,
    })
    .from(ticketTypes)
    .where(inArray(ticketTypes.eventId, eventIds))

  // Ventes réelles par événement (les billets annulés ne comptent pas).
  const soldRows = await db
    .select({ eventId: tickets.eventId, count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(and(inArray(tickets.eventId, eventIds), inArray(tickets.status, ['valid', 'used'])))
    .groupBy(tickets.eventId)
  const soldByEvent = new Map(soldRows.map((row) => [row.eventId, row.count]))

  // Assemblage des cartes (agrégations calculées en mémoire).
  return rows.map(({ event, organizerName, organizerSlug }) => {
    const eventTypes = types.filter((type) => type.eventId === event.id)

    // Prix minimum parmi les types payants + devise associée.
    const paid = eventTypes
      .map((type) => ({ price: Number(type.price), currency: type.currency as 'USD' | 'CDF' }))
      .filter((type) => type.price > 0)
      .sort((a, b) => a.price - b.price)
    const cheapest = paid[0]

    const capacity = eventTypes.reduce((sum, type) => sum + (type.capacity ?? 0), 0)
    const totalCapacity = capacity > 0 ? capacity : null
    const soldCount = soldByEvent.get(event.id) ?? 0

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      category: event.category,
      categoryCustom: event.categoryCustom,
      venue: event.venue,
      location: event.location,
      startAt: event.startAt,
      endAt: event.endAt,
      posterUrl: event.posterUrl,
      minPrice: cheapest?.price ?? null,
      minPriceCurrency: cheapest?.currency ?? null,
      isFree: paid.length === 0,
      capacity: totalCapacity,
      soldCount,
      isSoldOut: totalCapacity !== null && soldCount >= totalCapacity,
      organizerName,
      organizerSlug,
    }
  })
}

// Server Action PUBLIQUE — événements à venir (aucune session requise).
// Partagée par la landing (bandeau « À venir », `limit`) et le listing
// (filtres applicables en base pour la future route `/events` SEO) ;
// la vue SPA applique ses filtres client sur la liste complète.
export async function getPublicEvents(query: PublicEventsQuery = {}): Promise<ActionResult<PublicEventCard[]>> {
  try {
    const eventsList = await loadPublicEventCards(query)
    return { success: true, data: eventsList }
  } catch {
    return { success: false, error: 'Impossible de charger les événements.' }
  }
}

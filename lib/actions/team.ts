'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Équipe / Scanneurs (Phase 7.1, RBAC).
//
// L'organisateur gère ses agents de contrôle : création (nom seul — EMAIL et
// MOT DE PASSE auto-générés côté serveur), assignation aux événements,
// suspension/réactivation, réinitialisation (génère un nouveau mot de passe),
// suppression.
//
// Le mot de passe généré n'est JAMAIS stocké en clair : il est renvoyé UNE
// SEULE fois à la création/réinitialisation (affichage de transmission), puis
// seul le hash bcrypt est conservé en base.
//
// Défense en profondeur : chaque action exige une session ORGANISATEUR et la
// propriété (`agent.organizer_id === session.id`).
// ────────────────────────────────────────────────────────────────────────────

import { randomInt } from 'node:crypto'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db'
import { agentEventAccess, events, scans, tickets, ticketTypes, users, type User } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { slugify } from '@/lib/slug'
import { normalizeTicketCode } from '@/lib/ticket-code'

export type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

// Alphabet SANS ambiguïté (pas de 0/O/1/I) — dicté par téléphone/WhatsApp,
// lettres toujours en majuscules (décision produit). 32 caractères.
const AGENT_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const AGENT_PASSWORD_LENGTH = 8

// Génère un mot de passe d'agent : 8 caractères majuscules/chiffres,
// sans caractère ambigu (ex. `K9M4X2A8`). Crypto côté serveur uniquement.
function generateAgentPassword(): string {
  let password = ''
  for (let i = 0; i < AGENT_PASSWORD_LENGTH; i++) {
    password += AGENT_PASSWORD_ALPHABET[randomInt(AGENT_PASSWORD_ALPHABET.length)]
  }
  return password
}

// Schéma de création d'un agent : l'ORGANISATEUR choisit le NOM (+ événements
// assignés) — jamais l'email ni le mot de passe, tous deux auto-générés.
const createAgentSchema = z.object({
  name: z.string().trim().min(2, 'Le nom est obligatoire (2 caractères min).').max(255, 'Le nom est trop long.'),
  eventIds: z.array(z.string().uuid('Événement invalide.')).max(50).optional(),
})

function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

// Organisateur de session (rôle organizer) ou null.
async function getSessionOrganizer(): Promise<User | null> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') return null
  return user
}

// Email synthétique unique AUTO-GÉNÉRÉ : `{slug}-{n}@kinpass.com` — le n
// incrémental garantit l'unicité (jamais de collision avec un compte réel).
async function generateAgentEmail(organizer: User): Promise<string> {
  const base = slugify(organizer.slug ?? organizer.fullName) || 'agent'
  for (let n = 1; n <= 999; n++) {
    const candidate = `${base}-${String(n).padStart(2, '0')}@kinpass.com`
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, candidate))
      .limit(1)
    if (existing.length === 0) return candidate
  }
  // Repli (quasi impossible) : suffixe aléatoire.
  return `${base}-${Date.now().toString(36)}@kinpass.com`
}

// Agent + ses accès (événements assignés) — renvoyé par l'UI équipe.
export type TeamAgent = {
  id: string
  email: string
  fullName: string
  active: boolean
  createdAt: Date
  events: Array<{ id: string; title: string; status: string }>
  // Activité de scan (Phase 7.3 — l'organisateur voit qui scanné quoi).
  scanCount: number
  lastScannedAt: Date | null
}

// Liste les agents de l'organisateur connecté + leurs événements assignés.
export async function getTeam(): Promise<ActionResult<TeamAgent[]>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const agents = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        active: users.active,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, 'agent'), eq(users.organizerId, organizer.id)))
      .orderBy(users.createdAt)

    if (agents.length === 0) return { success: true, data: [] }

    // Accès groupés (une requête pour tous les agents).
    const accesses = await db
      .select({
        agentId: agentEventAccess.agentId,
        eventId: agentEventAccess.eventId,
        title: events.title,
        status: events.status,
      })
      .from(agentEventAccess)
      .innerJoin(events, eq(events.id, agentEventAccess.eventId))
      .where(inArray(agentEventAccess.agentId, agents.map((a) => a.id)))

    const eventsByAgent = new Map<string, TeamAgent['events']>()
    for (const access of accesses) {
      const list = eventsByAgent.get(access.agentId) ?? []
      list.push({ id: access.eventId, title: access.title, status: access.status })
      eventsByAgent.set(access.agentId, list)
    }

    // Activité de scan (count + dernier passage) pour tous les agents.
    const scanStats = await db
      .select({
        agentId: scans.agentId,
        count: sql<number>`count(*)::int`,
        lastAt: sql<Date | null>`max(${scans.scannedAt})`,
      })
      .from(scans)
      .where(inArray(scans.agentId, agents.map((a) => a.id)))
      .groupBy(scans.agentId)
    const statsByAgent = new Map(scanStats.map((row) => [row.agentId, row]))

    return {
      success: true,
      data: agents.map((agent) => {
        const stats = statsByAgent.get(agent.id)
        return {
          ...agent,
          events: eventsByAgent.get(agent.id) ?? [],
          scanCount: stats?.count ?? 0,
          lastScannedAt: stats?.lastAt ?? null,
        }
      }),
    }
  } catch {
    return { success: false, error: 'Impossible de charger votre équipe.' }
  }
}

// Résultat de création/réinitialisation : l'agent + le mot de passe généré
// (renvoyé UNE SEULE fois pour transmission — seul le hash est en base).
export type AgentWithPasswordOnce = { agent: TeamAgent; passwordOnce: string }

// Crée un agent (email + mot de passe AUTO-GÉNÉRÉS côté serveur) et
// l'assigne aux événements choisis.
export async function createAgent(
  input: z.infer<typeof createAgentSchema>,
): Promise<ActionResult<AgentWithPasswordOnce>> {
  const parsed = createAgentSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodMessage(parsed.error) }
  const data = parsed.data

  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const email = await generateAgentEmail(organizer)
    // Mot de passe généré (jamais saisi par l'organisateur), hashé en base.
    const passwordOnce = generateAgentPassword()
    const [agent] = await db
      .insert(users)
      .values({
        email,
        fullName: data.name.trim(),
        passwordHash: hashPassword(passwordOnce),
        role: 'agent',
        provider: 'email',
        // Rattachement à l'organisateur (défense en profondeur).
        organizerId: organizer.id,
        active: true,
      })
      .returning()

    // Assignations aux événements (vérifiés comme appartenant à l'organisateur).
    if (data.eventIds && data.eventIds.length > 0) {
      const owned = await db
        .select({ id: events.id })
        .from(events)
        .where(and(inArray(events.id, data.eventIds), eq(events.organizerId, organizer.id)))
      await db
        .insert(agentEventAccess)
        .values(owned.map((event) => ({ agentId: agent.id, eventId: event.id })))
    }

    return { success: true, data: { agent: await fetchAgent(agent.id, organizer.id), passwordOnce } }
  } catch {
    return { success: false, error: "Impossible de créer l'agent." }
  }
}

// Désactive (suspension douce) ou réactive un agent.
export async function setAgentActive(agentId: string, active: boolean): Promise<ActionResult<TeamAgent>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const [updated] = await db
      .update(users)
      .set({ active })
      .where(and(eq(users.id, agentId), eq(users.organizerId, organizer.id), eq(users.role, 'agent')))
      .returning()
    if (!updated) return { success: false, error: 'Agent introuvable.' }
    return { success: true, data: await fetchAgent(agentId, organizer.id) }
  } catch {
    return { success: false, error: 'Impossible de modifier cet agent.' }
  }
}

// Réinitialise le mot de passe d'un agent : un NOUVEAU mot de passe est
// généré côté serveur et renvoyé une seule fois (jamais de « mot de passe
// oublié » pour un compte synthétique ; seul l'organisateur peut réinitialiser).
export async function resetAgentPassword(agentId: string): Promise<ActionResult<{ passwordOnce: string }>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const passwordOnce = generateAgentPassword()
    const [updated] = await db
      .update(users)
      .set({ passwordHash: hashPassword(passwordOnce) })
      .where(and(eq(users.id, agentId), eq(users.organizerId, organizer.id), eq(users.role, 'agent')))
      .returning()
    if (!updated) return { success: false, error: 'Agent introuvable.' }
    return { success: true, data: { passwordOnce } }
  } catch {
    return { success: false, error: 'Impossible de réinitialiser le mot de passe.' }
  }
}

// Supprime un agent (les assignations partent en cascade).
export async function deleteAgent(agentId: string): Promise<ActionResult<null>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    await db
      .delete(users)
      .where(and(eq(users.id, agentId), eq(users.organizerId, organizer.id), eq(users.role, 'agent')))
    return { success: true, data: null }
  } catch {
    return { success: false, error: "Impossible de supprimer l'agent." }
  }
}

// Ajoute ou retire l'accès d'un agent à un événement (événements de
// l'organisateur uniquement — jamais un événement d'autrui).
export async function assignAgentToEvent(agentId: string, eventId: string): Promise<ActionResult<TeamAgent>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const [agent] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, agentId), eq(users.organizerId, organizer.id), eq(users.role, 'agent')))
      .limit(1)
    const [event] = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!agent || !event) return { success: false, error: 'Agent ou événement introuvable.' }

    // Idempotent : une assignation existante n'est pas dupliquée.
    const existing = await db
      .select({ id: agentEventAccess.id })
      .from(agentEventAccess)
      .where(and(eq(agentEventAccess.agentId, agentId), eq(agentEventAccess.eventId, eventId)))
      .limit(1)
    if (existing.length === 0) {
      await db.insert(agentEventAccess).values({ agentId, eventId })
    }
    return { success: true, data: await fetchAgent(agentId, organizer.id) }
  } catch {
    return { success: false, error: "Impossible d'assigner cet événement." }
  }
}

export async function unassignAgentFromEvent(agentId: string, eventId: string): Promise<ActionResult<TeamAgent>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    await db
      .delete(agentEventAccess)
      .where(and(eq(agentEventAccess.agentId, agentId), eq(agentEventAccess.eventId, eventId)))
    return { success: true, data: await fetchAgent(agentId, organizer.id) }
  } catch {
    return { success: false, error: "Impossible de retirer cet événement." }
  }
}

// Recharge un agent complet (accès inclus) — helper interne.
async function fetchAgent(agentId: string, organizerId: string): Promise<TeamAgent> {
  const [agent] = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: users.fullName,
      active: users.active,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(eq(users.id, agentId), eq(users.organizerId, organizerId)))
    .limit(1)

  const accesses = await db
    .select({
      eventId: agentEventAccess.eventId,
      title: events.title,
      status: events.status,
    })
    .from(agentEventAccess)
    .innerJoin(events, eq(events.id, agentEventAccess.eventId))
    .where(eq(agentEventAccess.agentId, agentId))

  return {
    id: agent.id,
    email: agent.email,
    fullName: agent.fullName,
    active: agent.active,
    createdAt: agent.createdAt,
    events: accesses.map((access) => ({ id: access.eventId, title: access.title, status: access.status })),
    scanCount: 0,
    lastScannedAt: null,
  }
}

// Journal des scans d'un agent (vu par SON organisateur, Phase 7.3).
export type AgentScanLog = {
  code: string
  buyerName: string
  result: string
  eventTitle: string
  scannedAt: Date
}

// Liste les 20 derniers scans d'un agent de l'organisateur connecté.
export async function getAgentScans(agentId: string): Promise<ActionResult<AgentScanLog[]>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    // L'agent doit appartenir à CET organisateur.
    const [agent] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, agentId), eq(users.organizerId, organizer.id), eq(users.role, 'agent')))
      .limit(1)
    if (!agent) return { success: false, error: 'Agent introuvable.' }

    const rows = await db
      .select({
        code: tickets.code,
        buyerName: tickets.buyerName,
        result: scans.result,
        eventTitle: events.title,
        scannedAt: scans.scannedAt,
      })
      .from(scans)
      .innerJoin(tickets, eq(tickets.id, scans.ticketId))
      .innerJoin(events, eq(events.id, scans.eventId))
      .where(eq(scans.agentId, agentId))
      .orderBy(desc(scans.scannedAt))
      .limit(20)
    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Impossible de charger les scans.' }
  }
}

// ── Vue « Scan » de l'organisateur (Phase 7.3+ — dashboard en direct) ───────

// Résumé par événement pour le tableau de bord d'entrées.
export type ScanOverviewEvent = {
  id: string
  title: string
  slug: string
  status: string
  startAt: Date | null
  capacity: number | null
  soldCount: number
  checkedIn: number
}

// Derniers passages (avec l'agent qui a scanné) — flux « qui entre ».
export type RecentScanEntry = {
  code: string
  buyerName: string
  result: string
  scannedAt: Date
  eventTitle: string
  agentName: string | null
}

// Ligne du détail d'un événement : état réel du billet (entré ou non).
export type EventScanTicket = {
  id: string
  code: string
  buyerName: string
  ticketTypeName: string
  status: string
  scannedAt: Date | null
  agentName: string | null
}

// Détail SCAN d'un événement (vue organisateur « Entrées en direct »).
export type EventScanDetail = {
  event: ScanOverviewEvent
  tickets: EventScanTicket[]
  totalTickets: number
}

// Détail par événement : tous les billets avec leur état d'entrée (qui est
// entré, quand, par quel agent — et qui ne l'est pas encore).
export async function getEventScanDetail(eventId: string): Promise<ActionResult<EventScanDetail>> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const [event] = await db
      .select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        status: events.status,
        startAt: events.startAt,
      })
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.organizerId, organizer.id)))
      .limit(1)
    if (!event) return { success: false, error: 'Événement introuvable.' }

    // Billets (50 derniers créés) + type.
    const ticketRows = await db
      .select({
        id: tickets.id,
        code: tickets.code,
        buyerName: tickets.buyerName,
        ticketTypeName: ticketTypes.name,
        status: tickets.status,
        scannedAt: tickets.scannedAt,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .where(eq(tickets.eventId, eventId))
      .orderBy(desc(tickets.createdAt))
      .limit(50)

    // Agent du scan valide (premier passage) pour chaque billet entré.
    const scannedIds = ticketRows.filter((t) => t.scannedAt).map((t) => t.id)
    const agentsByTicket = new Map<string, string>()
    if (scannedIds.length > 0) {
      const scansAgent = await db
        .select({ ticketId: scans.ticketId, agentName: users.fullName })
        .from(scans)
        .leftJoin(users, eq(users.id, scans.agentId))
        .where(and(inArray(scans.ticketId, scannedIds), eq(scans.result, 'valid')))
      for (const row of scansAgent) {
        if (row.agentName) agentsByTicket.set(row.ticketId, row.agentName)
      }
    }

    const totalRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(eq(tickets.eventId, eventId))
    const soldRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(and(eq(tickets.eventId, eventId), inArray(tickets.status, ['valid', 'used'])))
    const entryRows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(scans)
      .where(and(eq(scans.eventId, eventId), eq(scans.result, 'valid')))

    return {
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          slug: event.slug,
          status: event.status,
          startAt: event.startAt,
          capacity: null,
          soldCount: soldRows[0]?.count ?? 0,
          checkedIn: entryRows[0]?.count ?? 0,
        },
        tickets: ticketRows.map((ticket) => ({
          id: ticket.id,
          code: ticket.code,
          buyerName: ticket.buyerName,
          ticketTypeName: ticket.ticketTypeName,
          status: ticket.status,
          scannedAt: ticket.scannedAt,
          agentName: ticket.scannedAt ? (agentsByTicket.get(ticket.id) ?? null) : null,
        })),
        totalTickets: totalRows[0]?.count ?? 0,
      },
    }
  } catch {
    return { success: false, error: 'Impossible de charger le détail.' }
  }
}

// Tableau de bord « entrées en direct » de l'organisateur : pour chaque
// événement (sold_count réel, capacité, entrées scannées) + flux des
// derniers passages avec l'agent responsable.
export async function getOrganizerScanOverview(): Promise<
  ActionResult<{ events: ScanOverviewEvent[]; recentScans: RecentScanEntry[] }>
> {
  const organizer = await getSessionOrganizer()
  if (!organizer) return { success: false, error: 'Connexion requise.' }

  try {
    const eventIds = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.organizerId, organizer.id))
      .orderBy(desc(events.createdAt))
    const ids = eventIds.map((row) => row.id)
    if (ids.length === 0) return { success: true, data: { events: [], recentScans: [] } }

    // Billets vendus (valid/used) par événement.
    const sold = await db
      .select({ eventId: tickets.eventId, count: sql<number>`count(*)::int` })
      .from(tickets)
      .where(and(inArray(tickets.eventId, ids), inArray(tickets.status, ['valid', 'used'])))
      .groupBy(tickets.eventId)
    const soldByEvent = new Map(sold.map((row) => [row.eventId, row.count]))

    // Entrées scannées (premier passage valide) par événement.
    const entries = await db
      .select({ eventId: scans.eventId, count: sql<number>`count(*)::int` })
      .from(scans)
      .where(and(inArray(scans.eventId, ids), eq(scans.result, 'valid')))
      .groupBy(scans.eventId)
    const checkedByEvent = new Map(entries.map((row) => [row.eventId, row.count]))

    // Capacités totales.
    const caps = await db
      .select({ eventId: ticketTypes.eventId, total: sql<number>`coalesce(sum(${ticketTypes.capacity}), 0)::int` })
      .from(ticketTypes)
      .where(inArray(ticketTypes.eventId, ids))
      .groupBy(ticketTypes.eventId)
    const capByEvent = new Map(caps.map((row) => [row.eventId, row.total]))

    const meta = await db
      .select({ id: events.id, title: events.title, slug: events.slug, status: events.status, startAt: events.startAt })
      .from(events)
      .where(eq(events.organizerId, organizer.id))
      .orderBy(desc(events.startAt))

    // Flux des 30 derniers passages (tous événements de l'organisateur).
    const recentScans = await db
      .select({
        code: tickets.code,
        buyerName: tickets.buyerName,
        result: scans.result,
        scannedAt: scans.scannedAt,
        eventTitle: events.title,
        agentName: users.fullName,
      })
      .from(scans)
      .innerJoin(tickets, eq(tickets.id, scans.ticketId))
      .innerJoin(events, eq(events.id, scans.eventId))
      .leftJoin(users, eq(users.id, scans.agentId))
      .where(inArray(scans.eventId, ids))
      .orderBy(desc(scans.scannedAt))
      .limit(30)

    return {
      success: true,
      data: {
        events: meta.map((event) => {
          const capacity = capByEvent.get(event.id) ?? 0
          return {
            id: event.id,
            title: event.title,
            slug: event.slug,
            status: event.status,
            startAt: event.startAt,
            capacity: capacity > 0 ? capacity : null,
            soldCount: soldByEvent.get(event.id) ?? 0,
            checkedIn: checkedByEvent.get(event.id) ?? 0,
          }
        }),
        recentScans: recentScans.map((row) => ({
          code: row.code,
          buyerName: row.buyerName,
          result: row.result,
          scannedAt: row.scannedAt,
          eventTitle: row.eventTitle,
          agentName: row.agentName,
        })),
      },
    }
  } catch {
    return { success: false, error: 'Impossible de charger la vue scan.' }
  }
}

// ── Espace agent (Phase 7.2/7.3) ────────────────────────────────────────────

// Événement assigné à un agent (carte de son espace de scan).
export type AgentAssignedEvent = {
  id: string
  slug: string
  title: string
  startAt: Date | null
  venue: string | null
  location: string | null
  status: string
}

// Liste les événements que l'AGENT CONNECTÉ est autorisé à scanner
// (uniquement via `agent_event_access` — jamais un autre événement).
export async function getAgentAssignedEvents(): Promise<ActionResult<AgentAssignedEvent[]>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent' || user.active === false) {
    return { success: false, error: 'Accès réservé aux agents de contrôle.' }
  }

  try {
    const rows = await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startAt: events.startAt,
        venue: events.venue,
        location: events.location,
        status: events.status,
      })
      .from(agentEventAccess)
      .innerJoin(events, eq(events.id, agentEventAccess.eventId))
      .where(eq(agentEventAccess.agentId, user.id))
      .orderBy(events.startAt)

    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Impossible de charger vos événements.' }
  }
}

// Retourne UN événement assigné à l'agent connecté (par slug) — avec son id
// pour les actions de scan. Introuvable ou non assigné → erreur.
export async function getAgentAssignedEventBySlug(
  slug: string,
): Promise<ActionResult<AgentAssignedEvent>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent' || user.active === false) {
    return { success: false, error: 'Accès réservé aux agents de contrôle.' }
  }

  try {
    const [row] = await db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        startAt: events.startAt,
        venue: events.venue,
        location: events.location,
        status: events.status,
      })
      .from(agentEventAccess)
      .innerJoin(events, eq(events.id, agentEventAccess.eventId))
      .where(and(eq(agentEventAccess.agentId, user.id), eq(events.slug, slug)))
      .limit(1)
    if (!row) return { success: false, error: 'Événement introuvable ou non assigné.' }
    return { success: true, data: row }
  } catch {
    return { success: false, error: 'Impossible de charger cet événement.' }
  }
}

// ── Scan d'un billet (Phase 7.3) ────────────────────────────────────────────

// Résultat d'un scan : VERT (valide, première entrée), ORANGE (déjà scanné),
// ROUGE (code inconnu ou étranger à l'événement).
export type ScanOutcome =
  | { result: 'valid'; buyerName: string; ticketTypeName: string }
  | { result: 'used'; firstScannedAt: Date }
  | { result: 'invalid' }

// Valide un billet pour l'événement de l'agent connecté.
//  - billet valide → marqué `used` + `scanned_at`, scan journalisé ;
//  - billet déjà utilisé → scan journalisé en `used` (heure du 1er passage) ;
//  - code inconnu ou appartenant à un AUTRE événement → `invalid`.
// Une seule requête indexée (tickets.code UNIQUE) + une écriture.
export async function scanTicket(eventId: string, rawCode: string): Promise<ActionResult<ScanOutcome>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent' || user.active === false) {
    return { success: false, error: 'Accès réservé aux agents de contrôle.' }
  }

  // L'agent doit être assigné à CET événement (défense en profondeur), et
  // l'événement doit être PUBLIÉ (terminé/brouillon → accès refusé).
  const [access] = await db
    .select({ id: agentEventAccess.id, status: events.status })
    .from(agentEventAccess)
    .innerJoin(events, eq(events.id, agentEventAccess.eventId))
    .where(and(eq(agentEventAccess.agentId, user.id), eq(agentEventAccess.eventId, eventId)))
    .limit(1)
  if (!access) return { success: false, error: 'Événement non assigné.' }
  if (access.status !== 'published') {
    return { success: false, error: 'Événement terminé ou non ouvert au contrôle.' }
  }

  // Normalisation : majuscules, tirets/espaces ignorés (cf. lib/ticket-code).
  const code = normalizeTicketCode(rawCode)
  if (!code || code.length !== 7) return { success: false, error: 'Code invalide.' }

  try {
    const [ticket] = await db
      .select({
        id: tickets.id,
        eventId: tickets.eventId,
        status: tickets.status,
        scannedAt: tickets.scannedAt,
        buyerName: tickets.buyerName,
        ticketTypeName: ticketTypes.name,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .where(eq(tickets.code, code))
      .limit(1)

    // Code inconnu, ou billet d'un AUTRE événement → ROUGE (rien à journaliser).
    if (!ticket || ticket.eventId !== eventId) {
      return { success: true, data: { result: 'invalid' } }
    }

    if (ticket.status === 'used' || ticket.scannedAt) {
      // Déjà scanné → ORANGE (heure du premier passage conservée).
      await db.insert(scans).values({
        ticketId: ticket.id,
        eventId,
        agentId: user.id,
        result: 'used',
      })
      return {
        success: true,
        data: { result: 'used', firstScannedAt: ticket.scannedAt ?? new Date() },
      }
    }

    // Première entrée → VERT : billet marqué utilisé + scan journalisé.
    const now = new Date()
    await db.transaction(async (tx) => {
      await tx
        .update(tickets)
        .set({ status: 'used', scannedAt: now })
        .where(eq(tickets.id, ticket.id))
      await tx.insert(scans).values({
        ticketId: ticket.id,
        eventId,
        agentId: user.id,
        result: 'valid',
      })
    })

    return {
      success: true,
      data: { result: 'valid', buyerName: ticket.buyerName, ticketTypeName: ticket.ticketTypeName },
    }
  } catch {
    return { success: false, error: 'Scan impossible. Réessayez.' }
  }
}

// Historique des scans de l'AGENT connecté pour un événement (Phase 7.3 :
// « qui j'ai scanné ») — 20 derniers passages.
export type AgentScanEntry = { code: string; buyerName: string; result: string; scannedAt: Date }

export async function getAgentEventScans(eventId: string): Promise<ActionResult<AgentScanEntry[]>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') return { success: false, error: 'Accès réservé.' }

  try {
    const rows = await db
      .select({ code: tickets.code, buyerName: tickets.buyerName, result: scans.result, scannedAt: scans.scannedAt })
      .from(scans)
      .innerJoin(tickets, eq(tickets.id, scans.ticketId))
      .where(and(eq(scans.eventId, eventId), eq(scans.agentId, user.id)))
      .orderBy(desc(scans.scannedAt))
      .limit(20)
    return { success: true, data: rows }
  } catch {
    return { success: false, error: 'Impossible de charger les scans.' }
  }
}

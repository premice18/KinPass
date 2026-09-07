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
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db'
import { agentEventAccess, events, users, type User } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword } from '@/lib/password'
import { slugify } from '@/lib/slug'

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

    return {
      success: true,
      data: agents.map((agent) => ({
        ...agent,
        events: eventsByAgent.get(agent.id) ?? [],
      })),
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
  }
}

'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions publiques — Vérification d'un billet (Phase 12).
//
// `verifyTicket(code)` : recherche par code (index UNIQUE), retourne les
// 3 états (valid / used / unknown) avec des données MINIMALES (jamais de
// données de paiement ni de téléphone complet). Anti-abus : rate-limit par IP
// (en-têtes) ET par code ; réponse identique pour « introuvable » et
// « étranger » (pas d'énumération).
//
// `resendTicketByEmail(code, email)` : renvoie le PDF du billet par email,
// avec réponse générique (ne révèle pas si le code existe).
// ────────────────────────────────────────────────────────────────────────────

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db'
import { events, tickets, ticketTypes } from '@/lib/db/schema'
import { normalizeTicketCode } from '@/lib/ticket-code'
import { buildTicketPdf } from '@/lib/ticket/pdf'
import { sendTicketEmail } from '@/lib/mail'
import { APP_BASE_URL } from '@/lib/share'
import { isRateLimited, recordAttempt } from '@/lib/rate-limit'

// Fenêtres anti-abus.
const IP_WINDOW_MS = 60 * 1000
const IP_MAX = 20
const CODE_WINDOW_MS = 60 * 1000
const CODE_MAX = 5
const EMAIL_WINDOW_MS = 15 * 60 * 1000
const EMAIL_MAX = 3

// Résultat public d'une vérification (données strictement nécessaires).
export type TicketVerification = {
  status: 'valid' | 'used' | 'unknown'
  event?: {
    title: string
    slug: string
    startAt: Date | null
    venue: string | null
    location: string | null
  }
  ticketTypeName?: string
  buyerName?: string
  firstScannedAt?: Date | null
}

// Récupère l'IP cliente (proxy Vercel : x-forwarded-for).
async function clientIp(): Promise<string> {
  const store = await headers()
  const forwarded = store.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'unknown'
}

export async function verifyTicket(
  codeInput: string,
): Promise<{ success: true; data: TicketVerification } | { success: false; error: string }> {
  const code = normalizeTicketCode(codeInput)

  // Rate-limit par IP + par code (anti-bruteforce des codes 6 caractères).
  const ip = await clientIp()
  if (isRateLimited(`verify-ip:${ip}`, IP_MAX, IP_WINDOW_MS)) {
    return { success: false, error: 'Trop de tentatives. Réessayez dans une minute.' }
  }
  recordAttempt(`verify-ip:${ip}`, IP_WINDOW_MS)
  if (isRateLimited(`verify-code:${code}`, CODE_MAX, CODE_WINDOW_MS)) {
    return { success: false, error: 'Trop de tentatives sur ce code. Réessayez dans une minute.' }
  }
  recordAttempt(`verify-code:${code}`, CODE_WINDOW_MS)

  // Code mal formé → « introuvable » (même réponse qu'un code inconnu).
  if (code.length !== 7) return { success: true, data: { status: 'unknown' } }

  try {
    const [row] = await db
      .select({
        status: tickets.status,
        scannedAt: tickets.scannedAt,
        buyerName: tickets.buyerName,
        ticketTypeName: ticketTypes.name,
        eventTitle: events.title,
        eventSlug: events.slug,
        eventStartAt: events.startAt,
        eventVenue: events.venue,
        eventLocation: events.location,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .innerJoin(events, eq(events.id, tickets.eventId))
      .where(eq(tickets.code, code))
      .limit(1)

    if (!row) return { success: true, data: { status: 'unknown' } }

    return {
      success: true,
      data: {
        status: row.status === 'used' ? 'used' : row.status === 'valid' ? 'valid' : 'unknown',
        event: {
          title: row.eventTitle,
          slug: row.eventSlug,
          startAt: row.eventStartAt,
          venue: row.eventVenue,
          location: row.eventLocation,
        },
        ticketTypeName: row.ticketTypeName,
        buyerName: row.buyerName,
        firstScannedAt: row.scannedAt,
      },
    }
  } catch {
    return { success: false, error: 'Vérification impossible. Réessayez.' }
  }
}

const resendSchema = z.object({
  code: z.string().trim().min(1, 'Code obligatoire.'),
  email: z.string().trim().email('Adresse email invalide.'),
})

// Renvoie le billet (PDF) par email — réponse GÉNÉRIQUE (anti-énumération).
export async function resendTicketByEmail(
  input: { code: string; email: string },
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const parsed = resendSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }
  const code = normalizeTicketCode(parsed.data.code)
  const email = parsed.data.email.toLowerCase()

  const generic = {
    success: true as const,
    message: 'Si ce billet existe, il vient d’être envoyé à cette adresse.',
  }

  if (isRateLimited(`resend:${email}`, EMAIL_MAX, EMAIL_WINDOW_MS)) {
    return { success: false, error: 'Trop d’envois récents. Réessayez dans quelques minutes.' }
  }
  recordAttempt(`resend:${email}`, EMAIL_WINDOW_MS)

  try {
    if (code.length !== 7) return generic

    const [row] = await db
      .select({
        code: tickets.code,
        buyerName: tickets.buyerName,
        ticketTypeName: ticketTypes.name,
        eventTitle: events.title,
        eventSlug: events.slug,
        eventStartAt: events.startAt,
        eventVenue: events.venue,
        eventLocation: events.location,
      })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .innerJoin(events, eq(events.id, tickets.eventId))
      .where(eq(tickets.code, code))
      .limit(1)
    if (!row) return generic

    const pdf = await buildTicketPdf({
      code: row.code,
      eventTitle: row.eventTitle,
      eventDateLabel: row.eventStartAt
        ? new Date(row.eventStartAt).toLocaleDateString('fr-FR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) +
          ' à ' +
          new Date(row.eventStartAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        : undefined,
      venue: [row.eventVenue, row.eventLocation].filter(Boolean).join(' · ') || undefined,
      ticketTypeName: row.ticketTypeName,
      buyerName: row.buyerName,
      qrValue: row.code,
    })

    const result = await sendTicketEmail({
      to: email,
      buyerName: row.buyerName,
      eventTitle: row.eventTitle,
      tickets: [{ ticketTypeName: row.ticketTypeName, code: row.code }],
      attachments: [{ fileName: `kinpass-${row.code}.pdf`, pdfBuffer: pdf }],
      eventUrl: `${APP_BASE_URL}/e/${row.eventSlug}`,
    })

    // En développement sans clé, l'envoi est simulé (log) → on garde la
    // réponse générique ; en production, un échec réel est signalé.
    if (!result.ok && process.env.NODE_ENV === 'production' && process.env.RESEND_API_KEY) {
      return { success: false, error: 'Envoi impossible pour le moment. Réessayez plus tard.' }
    }
    return generic
  } catch {
    return { success: false, error: 'Envoi impossible pour le moment. Réessayez plus tard.' }
  }
}

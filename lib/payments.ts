import 'server-only'

// ────────────────────────────────────────────────────────────────────────────
// Exécution d'une commande PAYÉE (Phase 6.4).
//
// `fulfillPaidOrder` est le point unique de passage pending → paid :
//   - passe la commande à `paid` (référence KPay conservée) ;
//   - émet les billets (codes 6 caractères uniques, retry anti-collision) ;
//   - incrémente `ticket_types.sold_count` (jauge des ventes) ;
//   - renvoie le résultat pour l'email de remise.
//
// Appelé par le WEBHOOK KPay (`payment.completed`) ET par le mode
// « Simuler le paiement » (aucune clé) — mêmes règles, zéro duplication.
// ────────────────────────────────────────────────────────────────────────────

import { eq, sql } from 'drizzle-orm'

import { db } from '@/lib/db'
import { events, orderItems, orders, ticketTypes, tickets } from '@/lib/db/schema'
import { generateTicketCode } from '@/lib/ticket-code'
import { buildTicketPdf } from '@/lib/ticket/pdf'
import { sendTicketEmail } from '@/lib/mail'
import type { TicketArtwork } from '@/lib/ticket/types'

// Client de transaction (type drizzle) — les insertions retry se font DANS la
// transaction pour rester compatibles avec le pool `max: 1` (pas de deadlock).
type TxClient = Parameters<Parameters<typeof db.transaction>[0]>[0]

// Billet émis (renvoyé à l'acheteur après paiement).
export type IssuedTicket = {
  code: string
  ticketTypeName: string
}

export type FulfillmentResult = {
  orderId: string
  orderReference: string
  eventTitle: string
  buyerName: string
  deliveryMethod: string
  buyerEmail: string | null
  tickets: IssuedTicket[]
}

// Insère un billet avec un code unique (contrainte UNIQUE `tickets.code`).
// En cas de collision (rare), un nouveau code est généré — jusqu'à 6 essais.
async function insertTicketWithUniqueCode(
  tx: TxClient,
  params: {
    eventId: string
    ticketTypeId: string
    orderId: string
    buyerName: string
    buyerPhone: string | null
    buyerEmail: string | null
  },
): Promise<{ code: string }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateTicketCode()
    try {
      const [created] = await tx
        .insert(tickets)
        .values({
          eventId: params.eventId,
          ticketTypeId: params.ticketTypeId,
          orderId: params.orderId,
          buyerName: params.buyerName,
          buyerPhone: params.buyerPhone,
          buyerEmail: params.buyerEmail,
          code,
          status: 'valid',
        })
        .returning({ code: tickets.code })
      return created
    } catch (err) {
      // Collision de code unique : on régénère et on réessaie.
      const message = err instanceof Error ? err.message : ''
      if (!message.includes('duplicate key')) throw err
    }
  }
  throw new Error('Impossible de générer un code de billet unique.')
}

// Date courte en français pour le billet (ex. « samedi 20 septembre 2026 à 18:00 »).
function formatArtworkDate(value: Date | null): string | undefined {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

// Fait passer une commande `pending` à `paid` et émet ses billets.
// Idempotent : une commande déjà `paid`/`failed` n'est pas re-traitée.
export async function fulfillPaidOrder(orderId: string, paymentRef?: string | null): Promise<FulfillmentResult | null> {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order) return null
    // Déjà traitée (webhook rejoué, doublon) → rien à refaire.
    if (order.status !== 'pending') return null

    const [event] = await db
      .select({ title: events.title })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1)
    if (!event) return null

    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        ticketTypeId: orderItems.ticketTypeId,
        typeName: ticketTypes.name,
      })
      .from(orderItems)
      .innerJoin(ticketTypes, eq(ticketTypes.id, orderItems.ticketTypeId))
      .where(eq(orderItems.orderId, orderId))

    const issued: IssuedTicket[] = []
    await db.transaction(async (tx) => {
      for (const item of items) {
        // Jauge : les places vendues augmentent d'autant (une seule UPDATE).
        await tx
          .update(ticketTypes)
          .set({ soldCount: sql`${ticketTypes.soldCount} + ${item.quantity}` })
          .where(eq(ticketTypes.id, item.ticketTypeId))

        // Émission des billets (un par place), retry anti-collision dans la tx.
        for (let n = 0; n < item.quantity; n++) {
          const inserted = await insertTicketWithUniqueCode(tx, {
            eventId: order.eventId,
            ticketTypeId: item.ticketTypeId,
            orderId,
            buyerName: order.buyerName,
            buyerPhone: order.buyerPhone,
            buyerEmail: order.buyerEmail,
          })
          issued.push({ code: inserted.code, ticketTypeName: item.typeName })
        }
      }

      await tx
        .update(orders)
        .set({ status: 'paid', paymentRef: paymentRef ?? null })
        .where(eq(orders.id, orderId))
    })

    return {
      orderId: order.id,
      orderReference: order.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
      eventTitle: event.title,
      buyerName: order.buyerName,
      deliveryMethod: order.deliveryMethod,
      buyerEmail: order.buyerEmail,
      tickets: issued,
    }
  } catch (err) {
    console.error('[payments] Échec du traitement de la commande payée :', err)
    return null
  }
}

// Envoie les billets par email (remise `email`) — un PDF par billet en pièce
// jointe. Sans clé Resend (dev), l'envoi est simulé par un log (lib/mail).
export async function sendTicketsByEmail(result: FulfillmentResult): Promise<void> {
  if (result.deliveryMethod !== 'email' || !result.buyerEmail || result.tickets.length === 0) return

  try {
    // Informations d'événement pour habiller le PDF (date + lieu).
    const [event] = await db
      .select({ title: events.title, venue: events.venue, location: events.location, startAt: events.startAt })
      .from(events)
      .innerJoin(orders, eq(orders.eventId, events.id))
      .where(eq(orders.id, result.orderId))
      .limit(1)

    const venue = event?.venue ? [event.venue, event.location].filter(Boolean).join(' · ') : undefined

    const attachments = await Promise.all(
      result.tickets.map(async (ticket) => {
        const artwork: TicketArtwork = {
          code: ticket.code,
          eventTitle: result.eventTitle,
          eventDateLabel: formatArtworkDate(event?.startAt ?? null),
          venue,
          ticketTypeName: ticket.ticketTypeName,
          buyerName: result.buyerName,
          qrValue: ticket.code,
          orderReference: result.orderReference,
        }
        const pdf = await buildTicketPdf(artwork)
        return { fileName: `kinpass-${ticket.code}.pdf`, pdfBuffer: pdf }
      }),
    )

    await sendTicketEmail({
      to: result.buyerEmail,
      buyerName: result.buyerName,
      eventTitle: result.eventTitle,
      attachments,
    })
  } catch (err) {
    // Un échec d'email ne doit pas faire échouer la confirmation de paiement.
    console.error('[tickets] Envoi email impossible :', err)
  }
}

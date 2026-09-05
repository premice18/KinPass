import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

import { db } from '@/lib/db'
import { events, orders, tickets, ticketTypes } from '@/lib/db/schema'
import { buildTicketPdf } from '@/lib/ticket/pdf'

// ────────────────────────────────────────────────────────────────────────────
// Téléchargement PDF d'un billet — `GET /api/tickets/[code]/pdf`.
//
// Le billet (émis après paiement) est retrouvé par son code 6 caractères,
// puis le PDF est généré avec le moteur de production (react-pdf + QR).
// Route publique : le code (32⁶ combinaisons) sert de clé d'accès au MVP ;
// la page « Vérifier mon billet » (Phase 12) viendra enrichir ce flux.
// ────────────────────────────────────────────────────────────────────────────

interface TicketPdfParams {
  params: Promise<{ code: string }>
}

export async function GET(_request: Request, { params }: TicketPdfParams) {
  const { code } = await params

  const [ticket] = await db
    .select({
      code: tickets.code,
      buyerName: tickets.buyerName,
      ticketTypeName: ticketTypes.name,
      eventTitle: events.title,
      venue: events.venue,
      location: events.location,
      startAt: events.startAt,
      orderId: tickets.orderId,
    })
    .from(tickets)
    .innerJoin(ticketTypes, eq(tickets.ticketTypeId, ticketTypes.id))
    .innerJoin(events, eq(tickets.eventId, events.id))
    .where(eq(tickets.code, code.toUpperCase()))
    .limit(1)
  if (!ticket) notFound()

  // Référence de commande lisible (si le billet est rattaché à une commande).
  let orderReference: string | undefined
  if (ticket.orderId) {
    const [order] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.id, ticket.orderId))
      .limit(1)
    orderReference = order ? order.id.replace(/-/g, '').slice(0, 8).toUpperCase() : undefined
  }

  const pdf = await buildTicketPdf({
    code: ticket.code,
    eventTitle: ticket.eventTitle,
    eventDateLabel: ticket.startAt
      ? new Date(ticket.startAt).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }) +
        ' à ' +
        new Date(ticket.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : undefined,
    venue: [ticket.venue, ticket.location].filter(Boolean).join(' · ') || undefined,
    ticketTypeName: ticket.ticketTypeName,
    buyerName: ticket.buyerName,
    qrValue: ticket.code,
    orderReference,
  })

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="kinpass-${ticket.code}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}

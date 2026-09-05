'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Commandes (Phase 6.2, route `/e/[slug]/checkout`)
//
// `createOrder` : crée une commande `pending` avec ses lignes (order_items).
// Le prix unitaire et la jauge (capacité restante) sont RE-LUS en base — le
// client ne fournit que le type et la quantité, jamais de montant.
//
// Cycle de vie : la commande reste `pending` tant que le paiement Mobile
// Money n'est pas confirmé (webhook, Phase 6.4) ; c'est à ce moment que les
// billets sont générés (codes uniques + QR) et rattachés à la commande.
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { events, orderItems, orders, ticketTypes } from '@/lib/db/schema'
import { checkoutSchema, firstZodErrorMessage, type CheckoutInput } from '@/lib/validators/orders'

export type OrderResult =
  | { success: true; data: CreatedOrder }
  | { success: false; error: string }

// Détail renvoyé à l'acheteur après création de la commande.
export type CreatedOrder = {
  orderId: string
  // Référence lisible pour l'acheteur (8 premiers caractères de l'UUID).
  reference: string
  eventTitle: string
  eventSlug: string
  ticketTypeName: string
  quantity: number
  unitPrice: string
  totalAmount: string
  currency: string
  status: string
}

// Place une commande (statut `pending`) pour un événement publié.
// Aucune session requise (achat public) — toutes les règles de prix et de
// disponibilité sont vérifiées ici, jamais côté client.
export async function createOrder(input: CheckoutInput): Promise<OrderResult> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  try {
    // L'événement doit exister, être publié et ne pas être terminé.
    const [event] = await db
      .select({ title: events.title, slug: events.slug, status: events.status })
      .from(events)
      .where(eq(events.id, data.eventId))
      .limit(1)
    if (!event) return { success: false, error: 'Événement introuvable.' }
    if (event.status !== 'published') {
      return { success: false, error: 'La billetterie de cet événement est fermée.' }
    }

    // Le type de billet doit appartenir à l'événement (prix/jauge en base).
    const [type] = await db
      .select({
        id: ticketTypes.id,
        name: ticketTypes.name,
        price: ticketTypes.price,
        currency: ticketTypes.currency,
        capacity: ticketTypes.capacity,
        soldCount: ticketTypes.soldCount,
      })
      .from(ticketTypes)
      .where(eq(ticketTypes.id, data.ticketTypeId))
      .limit(1)
    if (!type) return { success: false, error: 'Type de billet introuvable.' }

    // Jauge : quantité demandée vs places réellement restantes.
    if (type.capacity != null) {
      const remaining = type.capacity - type.soldCount
      if (remaining <= 0) {
        return { success: false, error: 'Cet événement est complet.' }
      }
      if (data.quantity > remaining) {
        return {
          success: false,
          error: `Il ne reste que ${remaining} place${remaining > 1 ? 's' : ''} pour ce type de billet.`,
        }
      }
    }

    // Création atomique de la commande + sa ligne d'achat.
    const total = Number(type.price) * data.quantity
    const created = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          eventId: data.eventId,
          buyerName: data.buyerName,
          buyerPhone: data.buyerPhone,
          buyerEmail: data.buyerEmail?.trim() || null,
          totalAmount: total.toFixed(2),
          currency: type.currency,
          status: 'pending',
        })
        .returning()

      await tx.insert(orderItems).values({
        orderId: order.id,
        ticketTypeId: type.id,
        quantity: data.quantity,
        unitPrice: type.price,
      })
      return order
    })

    return {
      success: true,
      data: {
        orderId: created.id,
        reference: created.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
        eventTitle: event.title,
        eventSlug: event.slug,
        ticketTypeName: type.name,
        quantity: data.quantity,
        unitPrice: type.price,
        totalAmount: total.toFixed(2),
        currency: type.currency,
        status: created.status,
      },
    }
  } catch {
    return { success: false, error: 'Impossible de créer la commande. Réessayez.' }
  }
}

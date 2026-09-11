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
import { events, orderItems, orders, tickets, ticketTypes } from '@/lib/db/schema'
import { checkoutSchema, firstZodErrorMessage, type CheckoutInput } from '@/lib/validators/orders'
import { fulfillPaidOrder, sendTicketsByEmail, type EmailDeliveryStatus } from '@/lib/payments'
import { initKpayDeposit, kpayConfigured, normalizePhoneForKpay, toKpayCdfAmount } from '@/lib/kpay'
import { KPAY_COD_PROVIDERS, type KpayCodProviderId } from '@/lib/kpay-providers'

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
  deliveryMethod: string
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
          // Noms des participants (un par billet) ou null (tous au nom acheteur).
          attendees: data.attendees && data.attendees.length > 0 ? data.attendees : null,
          totalAmount: total.toFixed(2),
          currency: type.currency,
          // Mode de remise choisi à l'achat (Phase 6.3) : 'download' | 'email'.
          deliveryMethod: data.deliveryMethod ?? 'download',
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
        deliveryMethod: created.deliveryMethod,
      },
    }
  } catch {
    return { success: false, error: 'Impossible de créer la commande. Réessayez.' }
  }
}

// ── Paiement (Phase 6.4) ────────────────────────────────────────────────────

export type PaymentInitResult =
  | { success: true; mode: 'kpay' | 'simulated'; data: PaymentInitData }
  | { success: false; error: string }

export type PaymentInitData =
  | {
      // Mode KPay réel : le client valide le push USSD sur son téléphone.
      mode: 'kpay'
      paymentId: string
      reference: string
      status: string
      isTest: boolean
      message?: string
      orderId: string
    }
  | {
      // Mode simulé (aucune clé KPay) : commande payée immédiatement.
      mode: 'simulated'
      orderId: string
      orderReference: string
      eventTitle: string
      deliveryMethod: string
      buyerEmail: string | null
      tickets: Array<{ code: string; ticketTypeName: string }>
      // Statut de la remise par email (informatif pour l'écran de succès).
      emailStatus: EmailDeliveryStatus
    }

// Lance le paiement d'une commande `pending` :
//  - clés KPay configurées → init réelle (USSD, provider COD choisi) ;
//  - sinon → mode « Simuler le paiement » : la commande est traitée comme
//    payée immédiatement (mêmes règles que le webhook — démo/E2E).
export async function initiatePayment(orderId: string, providerId: KpayCodProviderId): Promise<PaymentInitResult> {
  const provider = KPAY_COD_PROVIDERS.find((p) => p.id === providerId)
  if (!provider) return { success: false, error: 'Opérateur Mobile Money invalide.' }

  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order || order.status !== 'pending') {
      return { success: false, error: 'Commande introuvable ou déjà traitée.' }
    }

    // ── Total nul (événement gratuit) : rien à facturer → payée d'office.
    //    Le parcours « entrée libre » complet (Phase 14) enrichira ce flux.
    if (Number(order.totalAmount) <= 0) {
      const fulfilled = await fulfillPaidOrder(orderId, null)
      if (!fulfilled) return { success: false, error: 'Impossible de confirmer la commande.' }
      const emailStatus = await sendTicketsByEmail(fulfilled)
      return {
        success: true,
        mode: 'simulated',
        data: {
          mode: 'simulated',
          orderId,
          orderReference: fulfilled.orderReference,
          eventTitle: fulfilled.eventTitle,
          deliveryMethod: fulfilled.deliveryMethod,
          buyerEmail: fulfilled.buyerEmail,
          tickets: fulfilled.tickets,
          emailStatus,
        },
      }
    }

    // ── Mode simulé (démo / E2E sans clés KPay) ───────────────────────────
    if (!kpayConfigured()) {
      const fulfilled = await fulfillPaidOrder(orderId, 'SIMULE')
      if (!fulfilled) return { success: false, error: 'Impossible de confirmer la commande.' }
      // Remise par email : envoi (ou log en développement).
      const emailStatus = await sendTicketsByEmail(fulfilled)
      return {
        success: true,
        mode: 'simulated',
        data: {
          mode: 'simulated',
          orderId,
          orderReference: fulfilled.orderReference,
          eventTitle: fulfilled.eventTitle,
          deliveryMethod: fulfilled.deliveryMethod,
          buyerEmail: fulfilled.buyerEmail,
          tickets: fulfilled.tickets,
          emailStatus,
        },
      }
    }

    // ── Mode KPay réel ────────────────────────────────────────────────────
    const [event] = await db
      .select({ title: events.title })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1)

    // Devise des billets (USD ou CDF) → montant CDF facturé par KPay COD.

    const payment = await initKpayDeposit({
      // Montant en CDF (devise locale du provider COD) — KPay attend `amount`.
      amount: toKpayCdfAmount(Number(order.totalAmount), order.currency === 'CDF' ? 'CDF' : 'USD'),
      provider: provider.provider,
      phoneNumber: normalizePhoneForKpay(order.buyerPhone ?? ''),
      // Idempotence KPay : le 409 bloque les doublons sur la même commande.
      externalId: order.id,
      description: event ? `Billets — ${event.title}` : 'Billets kinPass',
      customerName: order.buyerName,
      customerEmail: order.buyerEmail ?? undefined,
      metadata: { orderId: order.id },
    })

    return {
      success: true,
      mode: 'kpay',
      data: {
        mode: 'kpay',
        paymentId: payment.id,
        reference: payment.reference,
        status: payment.status,
        isTest: payment.isTest,
        message: payment.message,
        orderId: order.id,
      },
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paiement impossible.'
    return { success: false, error: `Paiement impossible : ${message}` }
  }
}

// Statut d'une commande (interrogé par l'écran d'attente du paiement).
// Quand la commande est `paid`, renvoie aussi les billets émis.
export async function getOrderStatus(orderId: string): Promise<
  | {
      success: true
      data: {
        status: string
        paymentRef: string | null
        tickets?: Array<{ code: string; ticketTypeName: string }>
      }
    }
  | { success: false; error: string }
> {
  try {
    const [order] = await db
      .select({ status: orders.status, paymentRef: orders.paymentRef })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order) return { success: false, error: 'Commande introuvable.' }

    const data: { status: string; paymentRef: string | null; tickets?: Array<{ code: string; ticketTypeName: string }> } = {
      status: order.status,
      paymentRef: order.paymentRef,
    }
    if (order.status === 'paid') {
      const issued = await db
        .select({ code: tickets.code, ticketTypeName: ticketTypes.name })
        .from(tickets)
        .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
        .where(eq(tickets.orderId, orderId))
        .orderBy(tickets.createdAt)
      data.tickets = issued
    }
    return { success: true, data }
  } catch {
    return { success: false, error: 'Impossible de lire le statut de la commande.' }
  }
}

// ── Page de confirmation publique (Phase 6.5) ───────────────────────────────

// Résumé public d'une commande PAYÉE (route /e/[slug]/checkout/success).
// Champs strictement utiles à l'acheteur — le paiement confirmé fait foi.
export type OrderSuccessSummary = {
  orderId: string
  reference: string
  status: string
  totalAmount: string
  currency: string
  deliveryMethod: string
  buyerName: string
  // Email masqué (ex. j***@e***.cd) — l'adresse réelle reste côté serveur.
  buyerEmailMasked: string | null
  event: {
    title: string
    slug: string
    venue: string | null
    location: string | null
    startAt: Date | null
    endAt: Date | null
  }
  tickets: Array<{ code: string; ticketTypeName: string }>
}

export async function getOrderSuccessSummary(
  orderId: string,
): Promise<{ success: true; data: OrderSuccessSummary } | { success: false; error: string }> {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order || order.status !== 'paid') return { success: false, error: 'Commande introuvable.' }

    const [event] = await db
      .select({ title: events.title, slug: events.slug, venue: events.venue, location: events.location, startAt: events.startAt, endAt: events.endAt })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1)
    if (!event) return { success: false, error: 'Commande introuvable.' }

    const issued = await db
      .select({ code: tickets.code, ticketTypeName: ticketTypes.name })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .where(eq(tickets.orderId, orderId))
      .orderBy(tickets.createdAt)

    return {
      success: true,
      data: {
        orderId: order.id,
        reference: order.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        deliveryMethod: order.deliveryMethod,
        buyerName: order.buyerName,
        buyerEmailMasked: order.buyerEmail ? maskEmail(order.buyerEmail) : null,
        event: {
          title: event.title,
          slug: event.slug,
          venue: event.venue,
          location: event.location,
          startAt: event.startAt,
          endAt: event.endAt,
        },
        tickets: issued,
      },
    }
  } catch {
    return { success: false, error: 'Commande introuvable.' }
  }
}

// Masque une adresse email (j***@e***.cd) pour l'affichage public.
function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  const [host, ...rest] = domain.split('.')
  return `${local.slice(0, 1)}***@${host.slice(0, 1)}***.${rest.join('.')}`
}

// Renvoie les billets par email depuis la page de confirmation (6.5).
// N'exige aucune session : le code d'accès de la commande (UUID) sert de clé.
export async function resendOrderTickets(
  orderId: string,
): Promise<{ success: boolean; emailStatus: EmailDeliveryStatus }> {
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1)
    if (!order || order.status !== 'paid' || !order.buyerEmail) {
      return { success: false, emailStatus: 'not-requested' }
    }

    const issued = await db
      .select({ code: tickets.code, ticketTypeName: ticketTypes.name })
      .from(tickets)
      .innerJoin(ticketTypes, eq(ticketTypes.id, tickets.ticketTypeId))
      .where(eq(tickets.orderId, orderId))
      .orderBy(tickets.createdAt)

    const [event] = await db
      .select({ title: events.title, slug: events.slug })
      .from(events)
      .where(eq(events.id, order.eventId))
      .limit(1)
    if (!event || issued.length === 0) return { success: false, emailStatus: 'not-requested' }

    const emailStatus = await sendTicketsByEmail({
      orderId: order.id,
      orderReference: order.id.replace(/-/g, '').slice(0, 8).toUpperCase(),
      eventTitle: event.title,
      eventSlug: event.slug,
      buyerName: order.buyerName,
      deliveryMethod: 'email',
      buyerEmail: order.buyerEmail,
      tickets: issued,
    })
    return { success: emailStatus === 'sent', emailStatus }
  } catch {
    return { success: false, emailStatus: 'failed' }
  }
}
// ────────────────────────────────────────────────────────────────────────────
// Webhook KPay — `/api/kpay/webhook` (Phase 6.4).
//
// Reçoit les notifications de statut des DÉPÔTS (callback « Dépôts » du
// dashboard KPay) : `payment.completed`, `payment.failed`, `payment.cancelled`.
//
// Sécurité (cf. kpay-context-node.md) :
//  - signature `X-KPAY-Signature` : HMAC-SHA256 du corps BRUT, comparée en
//    temps constant avec `KPAY_WEBHOOK_SECRET` (non vérifiée en dev sans secret) ;
//  - idempotence : une commande déjà `paid`/`failed` n'est jamais re-traitée ;
//  - réponse `200` rapide — un échec de traitement renvoie `500` (réessais
//    KPay : 3 tentatives, backoff 1 s/2 s/4 s, pas de réessai sur 4xx).
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { fulfillPaidOrder, sendTicketsByEmail } from '@/lib/payments'
import { verifyKpayWebhookSignature } from '@/lib/kpay'

// Corps d'événement attendu (champs utiles — voir la doc KPay).
interface KpayWebhookPayload {
  event?: string
  paymentId?: string
  reference?: string
  status?: string
  externalId?: string
}

export async function POST(request: Request) {
  // Corps BRUT pour la vérification de signature (jamais re-sérialisé).
  const rawBody = await request.text()
  const signature = request.headers.get('X-KPAY-Signature')

  if (!verifyKpayWebhookSignature(rawBody, signature)) {
    return new Response('Signature invalide.', { status: 401 })
  }

  let payload: KpayWebhookPayload
  try {
    payload = JSON.parse(rawBody) as KpayWebhookPayload
  } catch {
    return new Response('JSON invalide.', { status: 400 })
  }

  const { event, externalId, reference, status } = payload

  // Événement inconnu : on accuse réception sans traiter (ignoré).
  if (!event || !externalId) {
    return Response.json({ received: true })
  }

  try {
    if (event === 'payment.completed' && status === 'COMPLETED') {
      // Paiement confirmé → émission des billets + email de remise.
      const fulfilled = await fulfillPaidOrder(externalId, reference)
      if (fulfilled) {
        // Envoi best-effort : un échec d'email est loggé, jamais bloquant.
        await sendTicketsByEmail(fulfilled)
      }
    } else if (event === 'payment.failed' || event === 'payment.cancelled') {
      // Échec / annulation : la commande `pending` passe à `failed`.
      await db
        .update(orders)
        .set({ status: 'failed', paymentRef: reference ?? null })
        .where(eq(orders.id, externalId))
    }
  } catch (err) {
    console.error('[kpay-webhook] Erreur de traitement :', err)
    // 500 → KPay réessaiera (3 tentatives avec backoff).
    return new Response('Erreur de traitement.', { status: 500 })
  }

  return Response.json({ received: true })
}

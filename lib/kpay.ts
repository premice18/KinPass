import 'server-only'

// ────────────────────────────────────────────────────────────────────────────
// Client KPay (Phase 6.4) — encaissement Mobile Money RD Congo.
//
// Source : `kpay-context-node.md` (racine du projet). Une seule URL de base,
// l'environnement (test/live) est choisi par le PRÉFIXE des clés :
//   - test  : KPAY_API_KEY=`kpay_test_…` / KPAY_SECRET_KEY=`sk_test_…`
//   - live  : `kpay_live_…` / `sk_live_…`
//
// Sans clés configurées, le checkout passe en mode « Simuler le paiement »
// (parcours de démonstration/E2E complet, aucune clé requise).
//
// IMPORTANT — devise : `payments/init` n'accepte PAS de paramètre de devise
// (la devise est déduite du provider COD : CDF ou USD « selon l'opération »).
// Pour facturer proprement en CDF les billets libellés en USD, le montant est
// converti via `KPAY_USD_CDF_RATE` (défaut 2800, surchargeable par env). Un
// vrai taux dynamique (et la multi-devise) arriveront avec la Phase 10.
// ────────────────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from 'node:crypto'

// URL de base de l'API KPay (identique test/live).
const KPAY_BASE_URL = process.env.KPAY_BASE_URL ?? 'https://admin.kpay.site'

// Vrai si des clés KPay (test ou live) sont configurées.
export function kpayConfigured(): boolean {
  return Boolean(process.env.KPAY_API_KEY && process.env.KPAY_SECRET_KEY)
}

// Statuts terminaux KPay (source d'autorité : webhook).
export const KPAY_TERMINAL = { completed: 'COMPLETED', failed: 'FAILED', cancelled: 'CANCELLED' } as const

// Enveloppe d'erreur KPay : { statusCode, message, error }.
export type KpayError = { statusCode: number; message: string; error: string }

// Réponse d'initialisation d'un paiement USSD (champs utiles à kinPass).
export type KpayInitResult = {
  id: string
  reference: string
  status: string
  amount: number
  currency: string
  externalId: string
  provider: string | null
  isTest: boolean
  message?: string
}

// Convertit un montant kinPass (USD ou CDF) en montant CDF facturé par KPay.
// Les types de billets sont en USD ou CDF ; KPay COD est facturé en CDF.
export function toKpayCdfAmount(amount: number, currency: 'USD' | 'CDF'): number {
  if (currency === 'CDF') return Math.round(amount)
  const rate = Number(process.env.KPAY_USD_CDF_RATE ?? '2800')
  return Math.round(amount * rate)
}

// Normalise un numéro pour KPay : chiffres uniquement, sans + ni 0 initial.
export function normalizePhoneForKpay(phone: string): string {
  let digits = phone.replace(/[^\d]/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  return digits
}

// Requête authentifiée vers l'API KPay (headers X-API-Key / X-Secret-Key).
async function kpayFetch<T>(path: string, init: RequestInit & { body?: string }): Promise<T> {
  const apiKey = process.env.KPAY_API_KEY
  const secretKey = process.env.KPAY_SECRET_KEY
  const response = await fetch(`${KPAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-API-Key': apiKey ?? '',
      'X-Secret-Key': secretKey ?? '',
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })

  const body = (await response.json()) as T & KpayError
  if (!response.ok) {
    const error = new Error(body?.message ?? `KPay ${response.status}`) as Error & { statusCode?: number }
    error.statusCode = body?.statusCode ?? response.status
    throw error
  }
  return body
}

// Initie un paiement Mobile Money (mode USSD : push sur le téléphone du client).
// `externalId` = identifiant d'idempotence kinPass (id de commande) — 409 si
// une transaction active porte déjà ce même id.
export async function initKpayDeposit(params: {
  amountCdf: number
  provider: string
  phoneNumber: string
  externalId: string
  description?: string
  customerName?: string
  customerEmail?: string
  metadata?: Record<string, string>
}): Promise<KpayInitResult> {
  return kpayFetch<KpayInitResult>('/api/v1/payments/init', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

// Vérifie la signature d'un webhook KPay (HMAC-SHA256 hex du corps BRUT).
// Compare en temps constant ; aucune vérification si le secret n'est pas
// configuré (développement) — un avertissement est émis.
export function verifyKpayWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.KPAY_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[kpay] KPAY_WEBHOOK_SECRET absent : signature non vérifiée (développement).')
    return true
  }
  if (!signature) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

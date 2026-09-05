// ────────────────────────────────────────────────────────────────────────────
// Page de confirmation — `/e/[slug]/checkout/success?order=<id>` (Phase 6.5).
//
// Affiche le récapitulatif d'une commande PAYÉE (billets QR + téléchargements
// PDF/PNG/JPG, ajout au calendrier, renvoi par email). L'accès se fait via
// l'id de la commande (UUID) ; commande non payée ou inconnue → 404.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { OrderSuccessView } from '@/components/features/checkout/OrderSuccessView'
import { getOrderSuccessSummary } from '@/lib/actions/orders'

interface SuccessPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ order?: string }>
}

export const metadata: Metadata = {
  title: 'Paiement confirmé — kinPass',
  robots: 'noindex, nofollow',
}

export default async function SuccessPage({ params, searchParams }: SuccessPageProps) {
  const [{ slug }, { order }] = await Promise.all([params, searchParams])
  if (!order) notFound()

  const result = await getOrderSuccessSummary(order)
  if (!result.success) notFound()
  // Le slug de l'URL doit correspondre à la commande (pas de confusion).
  if (result.data.event.slug !== slug) notFound()

  return <OrderSuccessView summary={result.data} />
}

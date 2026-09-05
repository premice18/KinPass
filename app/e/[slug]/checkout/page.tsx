// ────────────────────────────────────────────────────────────────────────────
// Tunnel d'achat — `/e/[slug]/checkout` (Phase 6.2, route publique).
//
// Charge l'événement PUBLIÉ (mêmes règles que `/e/[slug]`) puis rend la
// coquille sur la vue « event-checkout » : les données sont injectées depuis
// le serveur, aucun appel client au montage. Un événement terminé (ou un
// brouillon, ou un slug inconnu) n'a pas de billetterie ouverte → 404.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { KinPassApp } from '@/components/KinPassApp'
import { getPublicEventBySlug } from '@/lib/actions/events'
import { APP_BASE_URL } from '@/lib/share'

interface CheckoutPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicEventBySlug(slug)
  if (!result?.success) return {}

  const event = result.data
  return {
    title: `Réserver — ${event.title} | kinPass`,
    description: event.description ?? undefined,
    alternates: { canonical: `${APP_BASE_URL}/e/${event.slug}/checkout` },
    robots: { index: false },
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params
  const result = await getPublicEventBySlug(slug)
  // Slug inconnu, brouillon ou événement terminé : pas de billetterie ouverte.
  if (!result?.success || result.data.status !== 'published') notFound()

  return <KinPassApp initialView="event-checkout" initialEvent={result.data} />
}

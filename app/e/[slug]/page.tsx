// ────────────────────────────────────────────────────────────────────────────
// Route publique d'un événement — `/e/[slug]` (Phase 6.1).
//
// - SEO : métadonnées dynamiques (`title`, `description`, `og:image` =
//   affiche) construites depuis l'événement en base — indispensable pour des
//   aperçus « riches » au partage (WhatsApp / réseaux, cf. Phase 6.7).
// - Accès : public (aucune session requise). Les brouillons et les slugs
//   inconnus renvoient une 404 (`notFound`).
// - Rendu : la coquille applicative (KinPassApp) affiche la vue événement
//   avec les données déjà chargées ici (`getPublicEventBySlug`, dé-dupliquée
//   par `react cache` entre les métadonnées et la page).
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { KinPassApp } from '@/components/KinPassApp'
import { getPublicEventBySlug } from '@/lib/actions/events'
import { APP_BASE_URL } from '@/lib/share'

interface EventPageProps {
  params: Promise<{ slug: string }>
}

// Métadonnées SEO dynamiques : titre, description et affiche (og:image).
export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicEventBySlug(slug)
  if (!result?.success) return {}

  const event = result.data
  const url = `${APP_BASE_URL}/e/${event.slug}`
  return {
    title: `${event.title} — billetterie kinPass`,
    description: event.description ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: `${event.title} — kinPass`,
      description: event.description ?? undefined,
      // L'affiche sert d'image de partage ; à défaut, la 1re photo de galerie.
      images: event.posterUrl
        ? [{ url: event.posterUrl, alt: `Affiche — ${event.title}` }]
        : event.images.length > 0
          ? [{ url: event.images[0].url, alt: event.images[0].alt ?? event.title }]
          : undefined,
    },
  }
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const result = await getPublicEventBySlug(slug)
  // Slug inconnu ou événement non publié (brouillon) : page 404.
  if (!result?.success) notFound()

  return <KinPassApp initialView="event" initialEvent={result.data} />
}

// ────────────────────────────────────────────────────────────────────────────
// Route publique d'un organisateur — `/o/[slug]` (Phase 9.5).
//
// Profil public (nom, avatar, bio, site web, Instagram) alimenté par la
// section « Présence » du profil (Phase 4.3) + liste de ses événements
// publiés à venir (règles de la vitrine). Aucune session requise ; aucun
// champ privé (téléphone, reversements…). Badge « vérifié » en Phase 11.
// Slug inconnu ou compte non-organisateur → 404.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Globe, Instagram } from 'iconoir-react'

import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { EventCard } from '@/components/features/events/EventCard'
import { FadeIn } from '@/components/ui/motion'
import { Eyebrow } from '@/components/ui/eyebrow'
import { getOrganizerPublicBySlug } from '@/lib/actions/organizers'
import { APP_BASE_URL } from '@/lib/share'

interface OrganizerPageProps {
  params: Promise<{ slug: string }>
}

// Métadonnées SEO dynamiques (bio en description, canonical).
export async function generateMetadata({ params }: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getOrganizerPublicBySlug(slug)
  if (!result.success) return {}

  const { fullName, bio } = result.data
  const description = bio?.slice(0, 160) ?? `Découvrez les événements de ${fullName} sur kinPass.`
  return {
    title: `${fullName} — organisateur | kinPass`,
    description,
    alternates: { canonical: `${APP_BASE_URL}/o/${slug}` },
  }
}

// Initiales du nom (avatar de repli, mêmes règles que la coquille).
function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { slug } = await params
  const result = await getOrganizerPublicBySlug(slug)
  if (!result.success) notFound()

  const organizer = result.data

  return (
    <div className="min-h-screen bg-background">
      {/* Barre supérieure discrète (logo → accueil, thème) */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="h-8 w-8 shrink-0" />
            kinPass
          </a>
          <ThemeToggle />
        </div>
      </header>

      {/* ── Profil (bandeau sombre, comme la page événement) ─────────────── */}
      <section className="border-b border-border bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Avatar : photo (profil/Google) ou initiales */}
            <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/15 bg-white/10 text-2xl font-bold">
              {organizer.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={organizer.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initialsOf(organizer.fullName)
              )}
            </span>

            <div className="min-w-0">
              <Eyebrow className="text-cyan-400">Organisateur</Eyebrow>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                {organizer.fullName}
              </h1>
              <p className="mt-2 max-w-xl text-slate-300">
                {organizer.events.length > 0
                  ? `${organizer.events.length} événement${organizer.events.length > 1 ? 's' : ''} à venir sur kinPass.`
                  : 'Pas encore d’événement publié à venir.'}
              </p>

              {/* Présence : site web + Instagram (section « Présence » du profil) */}
              {(organizer.website || organizer.instagram) && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {organizer.website && (
                    <a
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-300 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      {organizer.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </a>
                  )}
                  {organizer.instagram && (
                    <a
                      href={`https://instagram.com/${organizer.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-slate-300 underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                    >
                      <Instagram className="h-4 w-4" />
                      {organizer.instagram}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Bio + événements publiés ─────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {organizer.bio && (
          <section className="max-w-3xl">
            <Eyebrow>À propos</Eyebrow>
            <p className="mt-4 whitespace-pre-line text-lg leading-8 text-foreground/90">
              {organizer.bio}
            </p>
          </section>
        )}

        <section className="mt-12">
          <Eyebrow>Événements à venir</Eyebrow>
          {organizer.events.length === 0 ? (
            <p className="mt-6 text-muted-foreground">
              Aucun événement publié pour le moment — revenez bientôt.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {organizer.events.map((event, index) => (
                <FadeIn key={event.id} delay={Math.min(index * 0.06, 0.24)}>
                  <EventCard event={event} testId="public-event-card" />
                </FadeIn>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

'use client'

// ────────────────────────────────────────────────────────────────────────────
// Page publique d'un événement (Phase 6.1) — route `/e/[slug]`.
//
// Affiche les informations marketing d'un événement publié : affiche (ou 1re
// photo), titre, catégorie, date/lieu, description, galerie de photos (1 à 3,
// carrousel léger), tarifs des types de billets, bouton d'achat et partage
// (WhatsApp + copie du lien).
//
// Données injectées depuis le serveur (`getPublicEventBySlug`) : aucun appel
// client, la page est donc instantanée et indexable (SEO, cf. `generateMetadata`).
//
// NB (transition) : le bouton d'achat ouvre la maquette de checkout de la
// coquille SPA — il pointera vers la vraie route `/e/[slug]/checkout` (Phase 6.2).
// ────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  CardWallet,
  Clock,
  MapPin,
  NavArrowLeft,
  NavArrowRight,
  ShareAndroid,
  SmartphoneDevice,
  User,
} from 'iconoir-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { EventShareSheet } from '@/components/features/share/EventShareSheet'
import type { PublicEvent } from '@/lib/actions/events'

interface EventPublicViewProps {
  event: PublicEvent
}

// Catégorie affichée : la valeur personnalisée prime si « Autre ».
function categoryLabel(event: PublicEvent): string | null {
  if (!event.category) return null
  return event.category === 'Autre' && event.categoryCustom ? event.categoryCustom : event.category
}

// Formate le prix d'un billet selon sa devise (chiffres tabulaires).
function formatPrice(price: string, currency: string): string {
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(price))
  return currency === 'CDF' ? `${amount} FC` : `${amount} $`
}

// Formate la date complète d'un événement (ex. « samedi 20 septembre 2026 à 18:00 »).
function formatFullDate(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export function EventPublicView({ event }: EventPublicViewProps) {
  // Slider : l'affiche reste la « une » (1re slide) quand elle existe, suivie
  // des photos de la galerie (1 à 3). Le carrousel n'apparaît que si 2 slides.
  const slides = [
    ...(event.posterUrl ? [{ url: event.posterUrl, alt: `Affiche — ${event.title}` }] : []),
    ...event.images.map((image, index) => ({
      url: image.url,
      alt: image.alt ?? `${event.title} — photo ${index + 1}`,
    })),
  ]
  const [slideIndex, setSlideIndex] = useState(0)
  // Panneau de partage (Phase 6.7) : copie du lien, QR, canaux, natif.
  const [shareOpen, setShareOpen] = useState(false)

  const hasMedia = slides.length > 0
  const isFinished = event.status === 'finished'
  const isFree = event.ticketTypes.every((t) => Number(t.price) === 0)

  // Navigation du carrousel (bornée ; navigation clavier gérée sur le conteneur).
  const goToSlide = (index: number) => setSlideIndex((index + slides.length) % slides.length)

  return (
    <main className="min-h-screen bg-background">
      {/* ── En-tête de la page événement ─────────────────────────────────── */}
      <section className="border-b border-border bg-slate-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <Eyebrow className="text-cyan-400">{categoryLabel(event) ?? 'Événement'}</Eyebrow>
              <h1
                data-testid="event-public-title"
                className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl"
              >
                {event.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                {event.startAt && (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-cyan-400" />
                    {formatFullDate(event.startAt)}
                  </span>
                )}
                {(event.venue || event.location) && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    {[event.venue, event.location].filter(Boolean).join(' · ')}
                  </span>
                )}
                {/* Organisateur (page publique /o/[slug], Phase 9.5) */}
                {event.organizerName && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4 text-cyan-400" />
                    Organisé par{' '}
                    {event.organizerSlug ? (
                      <a
                        href={`/o/${event.organizerSlug}`}
                        className="font-medium text-white underline-offset-4 transition-colors hover:text-cyan-300 hover:underline"
                      >
                        {event.organizerName}
                      </a>
                    ) : (
                      <span className="font-medium text-white">{event.organizerName}</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Partage (Phase 6.7) : panneau complet — copie, QR, canaux,
                partage natif du système. */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-testid="event-public-share-open"
                onClick={() => setShareOpen(true)}
                aria-label="Partager l'événement"
                aria-haspopup="dialog"
                className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 text-[0.8rem] font-medium text-slate-200 transition-colors hover:bg-white/10"
              >
                <ShareAndroid className="h-3.5 w-3.5" />
                Partager
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Panneau modal de partage */}
      <EventShareSheet
        event={{ slug: event.slug, title: event.title, startAt: event.startAt, venue: event.venue ?? event.location }}
        open={shareOpen}
        onOpenChange={setShareOpen}
      />

      {/* ── Médias : affiche + galerie (carrousel léger) ─────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
        {hasMedia ? (
          <div
            data-testid="event-public-gallery"
            role="group"
            aria-label="Photos de l'événement"
            tabIndex={slides.length > 1 ? 0 : -1}
            onKeyDown={(e) => {
              if (slides.length < 2) return
              if (e.key === 'ArrowRight') goToSlide(slideIndex + 1)
              if (e.key === 'ArrowLeft') goToSlide(slideIndex - 1)
            }}
            className="focus-visible:ring-3 focus-visible:rounded-xl focus-visible:ring-ring"
          >
            <div className="relative overflow-hidden rounded-2xl border border-border">
              {/* Slide courante (fondu entre deux slides) */}
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.img
                  key={slideIndex}
                  data-testid="event-public-gallery-slide"
                  src={slides[slideIndex].url}
                  alt={slides[slideIndex].alt}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="h-72 w-full object-cover sm:h-96 lg:h-[28rem]"
                />
              </AnimatePresence>

              {/* Flèches de navigation (carrousel uniquement si 2+ médias) */}
              {slides.length > 1 && (
                <>
                  <button
                    type="button"
                    data-testid="event-public-gallery-prev"
                    aria-label="Photo précédente"
                    onClick={() => goToSlide(slideIndex - 1)}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                  >
                    <NavArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    data-testid="event-public-gallery-next"
                    aria-label="Photo suivante"
                    onClick={() => goToSlide(slideIndex + 1)}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background"
                  >
                    <NavArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            {/* Points de position (accessibles ; clic = aller à la photo) */}
            {slides.length > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label="Choisir une photo">
                {slides.map((slide, index) => (
                  <button
                    key={slide.url + index}
                    type="button"
                    role="tab"
                    data-testid="event-public-gallery-dot"
                    aria-selected={index === slideIndex}
                    aria-label={`Photo ${index + 1} sur ${slides.length}`}
                    onClick={() => goToSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === slideIndex ? 'w-6 bg-cyan-500' : 'w-2 bg-border hover:bg-muted-foreground/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Aucun visuel : trame de points de marque (perforation de billet).
          <div
            aria-hidden="true"
            className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
          >
            <CardWallet className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}
      </section>

      {/* ── Corps : description + billetterie ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
          {/* Colonne description */}
          <div>
            {event.description ? (
              <>
                <Eyebrow>À propos</Eyebrow>
                <p className="mt-4 whitespace-pre-line text-lg leading-8 text-foreground/90">
                  {event.description}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Aucune description pour le moment.</p>
            )}

            {/* Galerie si des images existent en plus de l'affiche */}
            {event.images.length > 0 && (
              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {event.images.map((image, index) => (
                  <figure
                    key={image.id}
                    className="overflow-hidden rounded-xl border border-border bg-muted/40"
                  >
                    <img
                      src={image.url}
                      alt={image.alt ?? `${event.title} — photo ${index + 1}`}
                      loading="lazy"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className="sr-only">
                      {image.alt ?? `${event.title} — photo ${index + 1}`}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>

          {/* Carte billetterie (sticky sur desktop) */}
          <Card className="lg:sticky lg:top-20">
            <CardContent className="space-y-5 p-6">
              <div>
                <Eyebrow>Billetterie</Eyebrow>
                {event.startAt && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatFullDate(event.startAt)}
                  </p>
                )}
              </div>

              {/* Tarifs par type de billet */}
              <div className="space-y-2.5">
                {event.ticketTypes.map((type) => (
                  <div
                    key={type.id}
                    data-testid="event-public-ticket-type"
                    className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-2.5 last:border-b-0 last:pb-0"
                  >
                    <span className="font-medium">{type.name}</span>
                    {Number(type.price) === 0 ? (
                      <Badge variant="success">Entrée libre</Badge>
                    ) : (
                      <span className="font-mono text-lg font-semibold tabular-nums">
                        {formatPrice(type.price, type.currency)}
                      </span>
                    )}
                  </div>
                ))}
                {isFree && (
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Entrée libre — inscrivez-vous en quelques secondes.
                  </p>
                )}
              </div>

              {/* Bouton d'achat : vraie route de checkout (Phase 6.2) */}
              {isFinished ? (
                <Button className="w-full" size="lg" disabled>
                  Billetterie terminée
                </Button>
              ) : (
                <a
                  href={`/e/${event.slug}/checkout`}
                  data-testid="event-public-buy"
                  className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full' })}
                >
                  <CardWallet className="h-4 w-4" />
                  Réserver maintenant
                </a>
              )}
              <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <SmartphoneDevice className="h-3.5 w-3.5" />
                M-Pesa · Orange Money · Airtel Money
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

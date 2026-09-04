'use client'

// ────────────────────────────────────────────────────────────────────────────
// Carte d'événement « talon premium » (Phase 9.4) — composant partagé.
//
// Utilisée par la landing (bandeau « À venir »), le listing « Billetterie »
// et la page publique organisateur. L'ensemble de la carte est cliquable et
// mène à la page publique `/e/[slug]` (Phase 6.1) ; le nom de l'organisateur
// reste un lien séparé (`/o/[slug]`, Phase 9.5).
//
// Anti-abus : le prix est réel (minimum des types payants, aucun nombre
// inventé), « Complet » n'apparaît que si la capacité est réellement atteinte.
// ────────────────────────────────────────────────────────────────────────────

import { Calendar, MapPin, User } from 'iconoir-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PublicEventCard } from '@/lib/actions/events'

interface EventCardProps {
  event: PublicEventCard
  // Couverture de repli (photo Pexels distribuée par le parent) — utilisée
  // uniquement si l'événement n'a pas d'affiche ; sinon motif de marque.
  coverUrl?: string | null
  className?: string
  // Identifiant stable pour les tests (kebab-case anglais).
  testId?: string
}

// Mois court en français pour la pastille de date.
const MONTHS_FR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

// Formate le prix minimum (chiffres tabulaires, devise RDC).
function formatPrice(price: number, currency: 'USD' | 'CDF' | null): string {
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(price)
  return currency === 'CDF' ? `${amount} FC` : `${amount} $`
}

// Date complète courte (ex. « sam. 20 sept. · 18:00 »).
function formatShortDate(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${time}`
}

// Catégorie affichée : la valeur personnalisée prime si « Autre ».
function categoryLabel(event: PublicEventCard): string | null {
  if (!event.category) return null
  return event.category === 'Autre' && event.categoryCustom ? event.categoryCustom : event.category
}

export function EventCard({ event, coverUrl, className, testId }: EventCardProps) {
  const date = event.startAt ? new Date(event.startAt) : null
  const day = date ? date.getDate() : null
  const month = date ? MONTHS_FR[date.getMonth()] : null
  const cover = event.posterUrl ?? coverUrl ?? null
  const category = categoryLabel(event)
  const venue = event.venue || event.location

  return (
    <article
      data-testid={testId}
      className={cn('group relative flex h-full flex-col rounded-lg border border-border bg-card text-card-foreground transition-colors hover:border-cyan-500/50', className)}
    >
      {/* Lien principal : toute la carte mène à la page publique /e/[slug]. */}
      <a
        href={`/e/${event.slug}`}
        aria-label={`Voir ${event.title}`}
        className="absolute inset-0 z-10 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
      />

      {/* ── Couverture (affiche / repli Pexels / motif de marque) ─────────── */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-lg border-b border-border bg-muted">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={`Affiche — ${event.title}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          // Repli de marque : trame de points (perforation du billet).
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] [background-size:22px_22px]">
            <MapPin className="h-7 w-7 text-muted-foreground/50" />
          </div>
        )}

        {/* Pastille de date : jour en gros + mois (rappel du talon) */}
        {day != null && month && (
          <div className="absolute left-3 top-3 flex h-12 w-12 flex-col items-center justify-center rounded-[3px] border border-border bg-background/95 text-center backdrop-blur">
            <span className="text-lg font-bold leading-none tabular-nums">{day}</span>
            <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {month}
            </span>
          </div>
        )}
      </div>

      {/* ── Contenu ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {category && <Badge variant="secondary">{category}</Badge>}
          {event.isFree ? (
            <Badge variant="success">Entrée libre</Badge>
          ) : event.isSoldOut ? (
            <Badge variant="destructive">Complet</Badge>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">{event.title}</h3>

        <div className="space-y-1 text-sm text-muted-foreground">
          {venue && (
            <p className="flex items-center gap-1.5 truncate">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{venue}</span>
            </p>
          )}
          {event.startAt && (
            <p className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="capitalize">{formatShortDate(event.startAt)}</span>
            </p>
          )}
        </div>

        {/* Talon de billet : filet pointillé + prix (rappel perforation) */}
        <div className="mt-auto border-t border-dashed border-border pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {event.isFree ? (
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Événement gratuit
              </span>
            ) : event.minPrice != null ? (
              <span className="flex items-baseline gap-1.5">
                <span className="text-xs text-muted-foreground">à partir de</span>
                <span className="font-mono text-lg font-semibold tabular-nums tracking-tight">
                  {formatPrice(event.minPrice, event.minPriceCurrency)}
                </span>
              </span>
            ) : null}
          </div>
          {/* Organisateur : lien séparé du lien principal de la carte */}
          {event.organizerName && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              par{' '}
              {event.organizerSlug ? (
                <a
                  href={`/o/${event.organizerSlug}`}
                  className="relative z-20 font-medium text-foreground underline-offset-2 hover:text-cyan-600 hover:underline dark:hover:text-cyan-400"
                >
                  {event.organizerName}
                </a>
              ) : (
                <span className="font-medium text-foreground">{event.organizerName}</span>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

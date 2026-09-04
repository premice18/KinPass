'use client'

// ────────────────────────────────────────────────────────────────────────────
// Listing « Événements à venir » — vue Billetterie de la coquille (Phase 9.3).
//
// Source unique de données : `getPublicEvents` (server action publique,
// Phase 9.1) — mêmes règles que la landing (événements publiés à venir,
// jamais de brouillons/terminés). Les filtres (catégories en chips,
// recherche par titre, tri par date) sont appliqués côté client sur la liste
// complète : réactifs, sans allers-retours serveur (la future route `/events`
// pourra les porter côté serveur pour le SEO).
//
// États gérés : chargement (cartes fantômes), erreur réseau (Réessayer),
// liste vide (CTA « Être prévenu » + « Créer un événement » si organisateur).
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { Refresh, Search, WarningCircle } from 'iconoir-react'

import { EventCard } from '@/components/features/events/EventCard'
import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import { FadeIn } from '@/components/ui/motion'
import { EmptyState } from '@/components/ui/empty-state'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { usePexelsImages } from '@/lib/hooks/use-pexels-images'
import { getPublicEvents, type PublicEventCard } from '@/lib/actions/events'
import { EVENT_CATEGORIES, type EventCategory } from '@/lib/constants'

type SortOrder = 'asc' | 'desc'

interface EventListingProps {
  // CTA de l'état vide, réservé à l'organisateur connecté.
  onCreateEvent?: () => void
}

// Classe partagée des <select> (mêmes styles que les autres formulaires).
const fieldClass =
  'flex h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function EventListing({ onCreateEvent }: EventListingProps) {
  const [events, setEvents] = useState<PublicEventCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtres (clients).
  const [category, setCategory] = useState<EventCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOrder>('asc')

  // Couvertures de repli (Pexels) pour les cartes sans affiche.
  const { images: coverImages } = usePexelsImages('concert crowd', 12)

  // Charge la liste des événements publics (une fois au montage).
  const load = async () => {
    setLoading(true)
    setError('')
    const result = await getPublicEvents()
    if (result.success) {
      setEvents(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtrage + tri (copie locale, aucune mutation).
  const visible = events
    .filter((event) => {
      if (category !== 'all' && event.category !== category) return false
      if (search.trim() && !event.title.toLowerCase().includes(search.trim().toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      const aTime = a.startAt ? new Date(a.startAt).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.startAt ? new Date(b.startAt).getTime() : Number.MAX_SAFE_INTEGER
      return sort === 'asc' ? aTime - bTime : bTime - aTime
    })

  // Les catégories réellement présentes (les autres restent sélectionnables
  // mais afficheront un état vide — comportement attendu du filtre).
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        {/* En-tête */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Billetterie</Eyebrow>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Événements à venir</h1>
            <p className="mt-1 text-muted-foreground">
              Découvrez les prochains événements en RDC.
            </p>
          </div>
          {!loading && !error && (
            <p className="text-sm text-muted-foreground" data-testid="listing-count">
              {visible.length} événement{visible.length > 1 ? 's' : ''}
              {search.trim() || category !== 'all' ? ' trouvé(s)' : ''}
            </p>
          )}
        </div>

        {/* Erreur réseau */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <span className="flex items-center gap-2">
              <WarningCircle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <Button variant="outline" size="sm" className="ml-auto" onClick={load} data-testid="listing-retry">
              <Refresh className="h-4 w-4" />
              Réessayer
            </Button>
          </div>
        )}

        {/* Barre de filtres */}
        {!loading && !error && events.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un événement…"
                aria-label="Rechercher un événement par titre"
                className="pl-9"
                data-testid="listing-search"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chips de catégories (accessibles : boutons, aria-pressed) */}
              <button
                type="button"
                role="checkbox"
                aria-checked={category === 'all'}
                onClick={() => setCategory('all')}
                data-testid="listing-chip"
                data-chip="all"
                className={cn(
                  'inline-flex h-7 items-center rounded-[3px] border-l-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                  category === 'all'
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                Tous
              </button>
              {EVENT_CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="checkbox"
                  aria-checked={category === c}
                  onClick={() => setCategory(category === c ? 'all' : c)}
                  data-testid="listing-chip"
                  data-chip={c}
                  className={cn(
                    'inline-flex h-7 items-center rounded-[3px] border-l-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-colors',
                    category === c
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {c}
                </button>
              ))}

              <div className="ml-auto">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  Trier
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOrder)}
                    className={fieldClass}
                    data-testid="listing-sort"
                  >
                    <option value="asc">Date croissante</option>
                    <option value="desc">Date décroissante</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Contenu : chargement / erreur / vide / grille */}
        <div className="mt-8">
          {loading ? (
            /* Squelettes de cartes (fantômes animées — pas de spinner) */
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="listing-skeleton">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="animate-pulse overflow-hidden rounded-lg border border-border bg-card">
                  <div className="aspect-[16/9] bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-muted" />
                    <div className="h-4 w-4/5 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 && !error ? (
            /* Aucun événement publié à venir */
            <EmptyState
              title="Aucun événement à venir pour le moment"
              description="Soyez prévenu dès qu'un événement est publié, ou créez le vôtre."
            >
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href="mailto:bonjour@kinpass.app?subject=Prévenez-moi des prochains événements"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Être prévenu
                </a>
                {onCreateEvent && <Button onClick={onCreateEvent}>Créer un événement</Button>}
              </div>
            </EmptyState>
          ) : visible.length === 0 ? (
            /* Filtres sans résultat (différent de la liste vide) */
            <EmptyState
              title="Aucun résultat"
              description="Modifiez votre recherche ou vos filtres pour trouver un événement."
            >
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setCategory('all')
                }}
              >
                Réinitialiser les filtres
              </Button>
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="listing-grid">
              {visible.map((event, index) => {
                // Couverture Pexels de repli (tournante) si l'événement n'a
                // pas d'affiche ; la carte retombe sur son motif de marque.
                const fallback = coverImages[index % Math.max(coverImages.length, 1)]
                return (
                  <FadeIn key={event.id} delay={Math.min(index * 0.05, 0.2)}>
                    <EventCard event={event} coverUrl={event.posterUrl ? null : (fallback?.src ?? null)} testId="public-event-card" />
                  </FadeIn>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

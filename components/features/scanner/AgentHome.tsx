'use client'

// ────────────────────────────────────────────────────────────────────────────
// Espace agent — `/scan` (Phase 7.2).
//
// Accueil du scanneur : la liste des événements qui lui sont ASSIGNÉS par son
// organisateur (via `agent_event_access`). Clic → `/scan/[slug]` (interface
// de scan, Phase 7.3). Aucun accès aux ventes, revenus ni réglages.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Calendar, MapPin, Refresh, WarningCircle } from 'iconoir-react'
import { signOut } from 'next-auth/react'

import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import { getAgentAssignedEvents, type AgentAssignedEvent } from '@/lib/actions/team'

function formatDate(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export function AgentHome() {
  const [events, setEvents] = useState<AgentAssignedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getAgentAssignedEvents()
    if (result.success) setEvents(result.data)
    else setError(result.error)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="min-h-screen bg-background">
      {/* Barre supérieure : logo, thème, déconnexion */}
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-8">
          <span className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="h-8 w-8 shrink-0" />
            kinPass
          </span>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => signOut({ redirect: true, callbackUrl: '/' })}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <Eyebrow>Contrôle d'accès</Eyebrow>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Mes événements</h1>
        <p className="mt-1 text-muted-foreground">
          Choisissez l'événement à contrôler — vous ne voyez que ceux qui vous sont assignés.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <WarningCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                <Refresh className="h-5 w-5 animate-spin" />
                Chargement…
              </CardContent>
            </Card>
          ) : events.length === 0 ? (
            <EmptyState
              title="Aucun événement assigné"
              description="Votre organisateur doit vous assigner un événement avant que vous puissiez contrôler les accès."
            />
          ) : (
            events.map((event) => {
              const scannable = event.status === 'published'
              return (
                <div
                  key={event.id}
                  data-testid="agent-event-card"
                  className={cn(
                    'flex flex-col gap-2 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between',
                    scannable
                      ? 'border-border transition-colors hover:border-cyan-500/50'
                      : 'border-border bg-muted/30 opacity-70',
                  )}
                >
                  <div>
                    <p className={cn('font-semibold', scannable && 'group-hover:text-cyan-600')}>
                      {event.title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      {event.startAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.startAt)}
                        </span>
                      )}
                      {(event.venue || event.location) && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {[event.venue, event.location].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {!scannable && (
                        <span className="rounded-[3px] bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {event.status === 'finished' ? 'Terminé' : 'Non ouvert'}
                        </span>
                      )}
                    </div>
                  </div>
                  {scannable ? (
                    <a
                      href={`/scan/${event.slug}`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      Contrôler les accès
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      Contrôle indisponible
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}

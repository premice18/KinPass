'use client'

// ────────────────────────────────────────────────────────────────────────────
// Vue « Scan » de l'ORGANISATEUR — tableau de bord des entrées en direct.
//
// L'organisateur ne scanne pas : il SUPERVISE. Pour chaque événement :
// billets vendus, capacité, entrées scannées (qui est ENTRÉ), restants à
// entrer — avec rafraîchissement automatique (15 s) pour « le jour J », et le
// flux des derniers passages (qui, quand, par quel agent). Les agents restent
// gérés depuis « Équipe / Scanneurs ».
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle, Clock, Refresh, UserPlus, WarningCircle } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils'
import {
  getEventScanDetail,
  getOrganizerScanOverview,
  type EventScanDetail,
  type RecentScanEntry,
  type ScanOverviewEvent,
} from '@/lib/actions/team'

interface ScanDashboardProps {
  onBack: () => void
  // Ouvre la gestion « Équipe / Scanneurs ».
  onOpenTeam: () => void
}

const REFRESH_MS = 15_000

export function ScanDashboard({ onBack, onOpenTeam }: ScanDashboardProps) {
  const [events, setEvents] = useState<ScanOverviewEvent[]>([])
  const [recentScans, setRecentScans] = useState<RecentScanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Rafraîchissement automatique « jour J » (désactivable).
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  // Détail d'un événement (panel ouvert par carte).
  const [detail, setDetail] = useState<EventScanDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const loadDetail = useCallback(async (eventId: string) => {
    setDetailLoading(true)
    const result = await getEventScanDetail(eventId)
    setDetailLoading(false)
    if (result.success) setDetail(result.data)
    else setError(result.error)
  }, [])

  const load = useCallback(async () => {
    const result = await getOrganizerScanOverview()
    if (result.success) {
      setEvents(result.data.events)
      setRecentScans(result.data.recentScans)
      setLastUpdated(new Date())
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Rafraîchissement automatique (silencieux, sans spinner).
  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => {
      void getOrganizerScanOverview().then((result) => {
        if (result.success) {
          setEvents(result.data.events)
          setRecentScans(result.data.recentScans)
          setLastUpdated(new Date())
        }
      })
    }, REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [autoRefresh])

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>

        {/* ── Détail d'un événement (remplace la vue d'ensemble) ──────────── */}
        {detail ? (
          <div data-testid="scan-dash-event-detail">
            <Button variant="ghost" className="-ml-3 mb-4" onClick={() => setDetail(null)}>
              <ArrowLeft className="h-4 w-4" />
              Vue d'ensemble
            </Button>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Eyebrow>Détail des entrées</Eyebrow>
                <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{detail.event.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.event.startAt
                    ? new Date(detail.event.startAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : '—'}{' '}
                  · {detail.totalTickets} billet{detail.totalTickets > 1 ? 's' : ''} au total
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDetail(detail.event.id)}
                  disabled={detailLoading}
                  aria-label="Actualiser le détail"
                >
                  <Refresh className={cn('h-4 w-4', detailLoading && 'animate-spin')} />
                  Actualiser
                </Button>
              </div>
            </div>

            {/* Rappel des compteurs */}
            <div className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
              <Counter label="Vendus" value={detail.event.soldCount} />
              <Counter label="Entrés" value={detail.event.checkedIn} tone="green" />
              <Counter
                label="Restants"
                value={Math.max(0, detail.event.soldCount - detail.event.checkedIn)}
                tone="amber"
              />
            </div>

            {/* Liste des billets (état d'entrée réel) */}
            <Card className="mt-6 overflow-hidden">
              {detailLoading ? (
                <CardContent className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
                  <Refresh className="h-5 w-5 animate-spin" />
                  Chargement du détail…
                </CardContent>
              ) : detail.tickets.length === 0 ? (
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Aucun billet pour cet événement.
                </CardContent>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Billet</th>
                        <th className="px-4 py-2.5 font-medium">Acheteur</th>
                        <th className="px-4 py-2.5 font-medium">Code</th>
                        <th className="px-4 py-2.5 font-medium">État</th>
                        <th className="px-4 py-2.5 font-medium">Entré à</th>
                        <th className="px-4 py-2.5 font-medium">Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {detail.tickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td className="px-4 py-2">{ticket.ticketTypeName}</td>
                          <td className="px-4 py-2">{ticket.buyerName}</td>
                          <td className="px-4 py-2 font-mono text-xs tracking-wider">{ticket.code}</td>
                          <td className="px-4 py-2">
                            {ticket.status === 'valid' ? (
                              <span className="rounded-[3px] bg-amber-500/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Pas encore entré
                              </span>
                            ) : ticket.status === 'used' ? (
                              <span className="inline-flex items-center gap-1 rounded-[3px] bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <CheckCircle className="h-3 w-3" />
                                Entré
                              </span>
                            ) : (
                              <span className="rounded-[3px] bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {ticket.status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {ticket.scannedAt
                              ? new Date(ticket.scannedAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{ticket.agentName ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Eyebrow>Contrôle d'accès</Eyebrow>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Entrées en direct</h1>
            <p className="mt-1 text-muted-foreground">
              Suivez qui est entré (et qui ne l'est pas encore) — le jour J, pensez à activer le
              rafraîchissement automatique.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenTeam} aria-label="Gérer les scanneurs">
              <UserPlus className="h-4 w-4" />
              Équipe / Scanneurs
            </Button>
            <Button
              variant={autoRefresh ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setAutoRefresh((value) => !value)}
              data-testid="scan-dash-autorefresh"
            >
              <Refresh className={cn('h-4 w-4', autoRefresh && 'animate-spin [animation-duration:3s]')} />
              Auto : 15 s {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button variant="outline" size="sm" onClick={load} aria-label="Actualiser" data-testid="scan-dash-refresh">
              <Refresh className="h-4 w-4" />
              Actualiser
            </Button>
          </div>
        </div>

        {lastUpdated && (
          <p className="mt-3 text-xs text-muted-foreground">
            Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <WarningCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ── Cartes événements : jauge d'entrées ─────────────────────────── */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">Chargement…</CardContent>
            </Card>
          ) : events.length === 0 ? (
            <Card className="sm:col-span-2 lg:col-span-3">
              <CardContent className="p-2">
                <EmptyState
                  title="Aucun événement"
                  description="Créez un événement pour suivre les entrées en direct."
                />
              </CardContent>
            </Card>
          ) : (
            events.map((event) => {
              const remaining = event.capacity != null ? Math.max(0, event.capacity - event.soldCount) : null
              const notYetIn = Math.max(0, event.soldCount - event.checkedIn)
              const pct = event.soldCount > 0 ? Math.round((event.checkedIn / event.soldCount) * 100) : 0
              return (
                <Card key={event.id} data-testid="scan-dash-event">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.status === 'published'
                            ? event.startAt
                              ? new Date(event.startAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                              : 'Publié'
                            : 'Brouillon'}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'inline-flex shrink-0 items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                          event.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {event.status === 'published' ? 'Publié' : 'Brouillon'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md border border-border bg-muted/30 p-2">
                        <p className="text-lg font-bold tabular-nums">{event.soldCount}</p>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vendus</p>
                      </div>
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2">
                        <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{event.checkedIn}</p>
                        <p className="text-[10px] uppercase tracking-wider text-emerald-700/70 dark:text-emerald-300/70">Entrés</p>
                      </div>
                      <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2">
                        <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">{notYetIn}</p>
                        <p className="text-[10px] uppercase tracking-wider text-amber-700/70 dark:text-amber-300/70">
                          Restants
                        </p>
                      </div>
                    </div>

                    {/* Barre de progression des entrées */}
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progression des entrées</span>
                        <span className="tabular-nums">{pct} %</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {remaining != null && (
                      <p className="text-xs text-muted-foreground">
                        {remaining > 0 ? `${remaining} place${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}` : 'Complet'}
                      </p>
                    )}

                    {/* Détail scan de l'événement (qui est entré / pas encore) */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => loadDetail(event.id)}
                      data-testid="scan-dash-event-detail-open"
                    >
                      Voir le détail des entrées
                    </Button>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* ── Flux des derniers passages ──────────────────────────────────── */}
        <h2 className="mt-10 text-xl font-semibold">Derniers passages</h2>
        <Card className="mt-3 overflow-hidden">
          {recentScans.length === 0 ? (
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun passage enregistré pour le moment.
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Heure</th>
                    <th className="px-4 py-2.5 font-medium">Acheteur</th>
                    <th className="px-4 py-2.5 font-medium">Code</th>
                    <th className="px-4 py-2.5 font-medium">Événement</th>
                    <th className="px-4 py-2.5 font-medium">Agent</th>
                    <th className="px-4 py-2.5 font-medium">Résultat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentScans.map((scan, index) => (
                    <tr key={`${scan.code}-${index}`}>
                      <td className="px-4 py-2 text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="px-4 py-2">{scan.buyerName}</td>
                      <td className="px-4 py-2 font-mono text-xs tracking-wider">{scan.code}</td>
                      <td className="px-4 py-2">{scan.eventTitle}</td>
                      <td className="px-4 py-2">{scan.agentName ?? '—'}</td>
                      <td className="px-4 py-2">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                            scan.result === 'valid'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          )}
                        >
                          {scan.result === 'valid' ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {scan.result === 'valid' ? 'Entrée' : 'Doublon'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        </>
        )}
      </div>
    </main>
  )
}

// Petite carte compteur du détail (barre latérale colorée).
function Counter({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border p-3 text-center',
        tone === 'green' && 'border-emerald-500/30 bg-emerald-500/10',
        tone === 'amber' && 'border-amber-500/30 bg-amber-500/10',
      )}
    >
      <p
        className={cn(
          'text-2xl font-bold tabular-nums',
          tone === 'green' && 'text-emerald-600 dark:text-emerald-400',
          tone === 'amber' && 'text-amber-600 dark:text-amber-400',
        )}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  )
}

'use client'

// ────────────────────────────────────────────────────────────────────────────
// Vue détail d'un événement (dashboard organisateur).
//
// Affiche, pour UN événement : en-tête (titre, statut, dates, lieu), KPIs
// dédiés, vente par type de billet, et les 25 derniers billets (code,
// acheteur, statut). Chargement via la Server Action `getEventDetail`.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Barcode, Calendar, CardWallet, Clock, MapPin, NewTab, Refresh, Scanning, StatsReport, WarningCircle } from 'iconoir-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eyebrow } from '@/components/ui/eyebrow'
import { cn } from '@/lib/utils'
import { getEventDetail, type EventDetailTicket, type EventWithStats } from '@/lib/actions/events'

// Libellé et variante de badge pour chaque statut d'événement.
const STATUS_META: Record<EventWithStats['status'], { label: string; badge: 'secondary' | 'success' | 'default' }> = {
  draft: { label: 'Brouillon', badge: 'secondary' },
  published: { label: 'Publié', badge: 'success' },
  finished: { label: 'Terminé', badge: 'default' },
}

// Statuts possibles d'un billet (badge).
const TICKET_STATUS: Record<string, { label: string; badge: 'success' | 'warning' | 'secondary' }> = {
  valid: { label: 'Valide', badge: 'success' },
  used: { label: 'Utilisé', badge: 'warning' },
  cancelled: { label: 'Annulé', badge: 'secondary' },
}

interface EventDetailProps {
  eventId: string
  // Retour à la liste des événements.
  onBack: () => void
  // Ouvre le formulaire d'édition (réutilisé par le dashboard).
  onEdit: (eventId: string) => void
}

// Formate un montant avec des milliers à la française et la devise RDC.
function formatMoney(amount: number, currency: 'USD' | 'CDF'): string {
  const formatted = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)
  return currency === 'USD' ? `${formatted} $` : `${formatted} FC`
}

function formatDate(value: Date | string | null): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function EventDetail({ eventId, onBack, onEdit }: EventDetailProps) {
  const [event, setEvent] = useState<EventWithStats | null>(null)
  const [tickets, setTickets] = useState<EventDetailTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Charge le détail de l'événement (Server Action sécurisée par session).
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const result = await getEventDetail(eventId)
    if (result.success) {
      setEvent(result.data.event)
      setTickets(result.data.tickets)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour aux événements
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Refresh className="h-5 w-5 animate-spin" />
            Chargement de l’événement…
          </div>
        </div>
      </main>
    )
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour aux événements
          </Button>
          <div
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            <WarningCircle className="h-4 w-4 shrink-0" />
            {error || 'Événement introuvable.'}
          </div>
        </div>
      </main>
    )
  }

  const status = STATUS_META[event.status]

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Button variant="ghost" className="-ml-3 mb-5" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux événements
        </Button>

        {/* En-tête de l'événement */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>Détail de l’événement</Eyebrow>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{event.title}</h1>
              <Badge variant={status.badge}>{status.label}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {event.startAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(event.startAt)}
                </span>
              )}
              {event.startAt && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {new Date(event.startAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.venue || event.location || 'Lieu à définir'}
              </span>
            </div>
          </div>
          {/* Page publique (Phase 6.1) : uniquement pour un événement publié —
              un brouillon n'a pas encore d'URL publique (404). */}
          <div className="flex flex-wrap items-center gap-2">
            {event.status === 'published' && (
              <a
                href={`/e/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
                aria-label={`Voir la page publique de ${event.title}`}
                data-testid="event-detail-public-link"
              >
                <NewTab className="h-4 w-4" />
                Page publique
              </a>
            )}
            <Button variant="outline" size="sm" onClick={() => onEdit(event.id)}>
              Modifier
            </Button>
          </div>
        </div>

        {/* KPIs de l'événement */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MiniStat
            icon={CardWallet}
            label="Revenus"
            value={formatMoney(event.revenueUSD, 'USD')}
            detail={event.revenueCDF > 0 ? `+ ${formatMoney(event.revenueCDF, 'CDF')} en FC` : 'Aucune vente en FC'}
          />
          <MiniStat
            icon={Barcode}
            label="Billets vendus"
            value={String(event.soldCount)}
            detail={event.capacity != null ? `sur ${event.capacity} disponibles` : 'capacité non définie'}
          />
          <MiniStat
            icon={StatsReport}
            label="Remplissage"
            value={`${event.fillRate} %`}
            detail={event.capacity != null ? `${event.soldCount} / ${event.capacity} places` : '—'}
          />
          <MiniStat
            icon={Scanning}
            label="Entrées"
            value={String(event.scannedCount)}
            detail={`${event.soldCount > 0 ? Math.round((event.scannedCount / event.soldCount) * 100) : 0} % des ventes`}
          />
        </div>

        {/* Vente par type de billet */}
        <h2 className="mt-8 text-xl font-semibold">Types de billets</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {event.ticketTypes.map((type) => (
            <Card key={type.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{type.name}</p>
                  <Badge variant={type.price === '0' ? 'success' : 'default'}>
                    {type.price === '0' ? 'Entrée libre' : `${Number(type.price)} ${type.currency}`}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Capacité : {type.capacity ?? 'illimitée'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Derniers billets vendus */}
        <h2 className="mt-8 text-xl font-semibold">Derniers billets</h2>
        <Card className="mt-3 overflow-hidden">
          {tickets.length === 0 ? (
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aucun billet pour le moment.
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Code</th>
                    <th className="px-4 py-3 font-medium">Acheteur</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((ticket) => {
                    const tStatus = TICKET_STATUS[ticket.status] ?? TICKET_STATUS.valid
                    return (
                      <tr key={ticket.id} className={cn('font-mono text-xs')}>
                        <td className="px-4 py-2.5 tracking-wider">{ticket.code}</td>
                        <td className="px-4 py-2.5 font-sans">{ticket.buyerName}</td>
                        <td className="px-4 py-2.5 font-sans">{ticket.typeName}</td>
                        <td className="px-4 py-2.5 font-sans">
                          <Badge variant={tStatus.badge}>{tStatus.label}</Badge>
                        </td>
                        <td className="px-4 py-2.5 font-sans text-muted-foreground">
                          {formatDate(ticket.createdAt)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}

// Mini carte KPI de la vue détail (barre latérale cyan, valeur tabulaire).
function MiniStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CardWallet
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-cyan-500" />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-5 w-5 text-cyan-500" />
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  )
}

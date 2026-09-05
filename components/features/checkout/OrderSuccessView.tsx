'use client'

// ────────────────────────────────────────────────────────────────────────────
// Page de confirmation publique — /e/[slug]/checkout/success (Phase 6.5).
//
// Récapitulatif d'une commande PAYÉE (chargée par le serveur via
// `getOrderSuccessSummary`) : billets avec QR + téléchargements
// PDF/PNG/JPG (cartes réutilisées du tunnel), « Ajouter au calendrier »
// (.ics) et renvoi des billets par email.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { CalendarPlus, Refresh, Send, WarningCircle, CheckCircle } from 'iconoir-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { IssuedTicketCard } from '@/components/features/checkout/IssuedTicketCard'
import { resendOrderTickets, type OrderSuccessSummary } from '@/lib/actions/orders'
import { buildEventIcs } from '@/lib/ticket/ics'
import { APP_BASE_URL } from '@/lib/share'

interface OrderSuccessViewProps {
  summary: OrderSuccessSummary
}

// Masque l'email saisi (l'adresse complète reste côté serveur).
function formatPrice(amount: string, currency: string): string {
  const value = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(amount))
  return currency === 'CDF' ? `${value} FC` : `${value} $`
}

function formatFullDate(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export function OrderSuccessView({ summary }: OrderSuccessViewProps) {
  const { event, tickets, buyerName, deliveryMethod, buyerEmailMasked } = summary
  const venue = [event.venue, event.location].filter(Boolean).join(' · ')

  // Renvoi par email (nouvel envoi explicite — fonctionne quel que soit le
  // mode de remise choisi à l'achat).
  const [isPending, startTransition] = useTransition()
  const [emailFeedback, setEmailFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  const resend = () => {
    setEmailFeedback(null)
    startTransition(async () => {
      const result = await resendOrderTickets(summary.orderId)
      if (result.emailStatus === 'sent') {
        setEmailFeedback({ ok: true, text: 'Billets renvoyés par email.' })
      } else if (result.emailStatus === 'unavailable') {
        setEmailFeedback({ ok: false, text: "L'envoi par email n'est pas configuré (développement)." })
      } else {
        setEmailFeedback({ ok: false, text: "L'envoi par email a échoué. Réessayez." })
      }
    })
  }

  // « Ajouter au calendrier » : génération locale du .ics puis téléchargement.
  const addToCalendar = () => {
    const startAt = event.startAt ? new Date(event.startAt) : new Date()
    const ics = buildEventIcs({
      title: event.title,
      description: `Billet kinPass — commande ${summary.reference}`,
      startAt,
      endAt: event.endAt,
      location: venue,
      url: `${APP_BASE_URL}/e/${event.slug}`,
      uid: `kinpass-${summary.orderId}@kinpass.app`,
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `kinpass-${event.slug}.ics`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-xl">
        <a
          href={`/e/${event.slug}`}
          className={buttonVariants({ variant: 'ghost', className: '-ml-3 mb-4' })}
        >
          ← Retour à l'événement
        </a>

        <Card data-testid="order-success-page">
          <CardContent className="space-y-5 p-6 sm:p-8">
            <div>
              <Eyebrow>Confirmation</Eyebrow>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Paiement confirmé</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Commande <span className="font-mono font-semibold text-foreground">{summary.reference}</span> —{' '}
                {summary.buyerName}
              </p>
            </div>

            {/* Récapitulatif */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Événement</dt>
                <dd className="mt-1 font-medium">{event.title}</dd>
                <dd className="mt-0.5 text-xs text-muted-foreground">{formatFullDate(event.startAt)}</dd>
                {venue && <dd className="text-xs text-muted-foreground">{venue}</dd>}
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-muted-foreground">Total payé</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {formatPrice(summary.totalAmount, summary.currency)}
                </dd>
                <dt className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">Billets</dt>
                <dd className="mt-1">
                  <Badge variant="success">{tickets.length} émis</Badge>
                </dd>
              </div>
            </dl>

            {/* Billets : QR + téléchargements */}
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <IssuedTicketCard
                  key={ticket.code}
                  ticket={ticket}
                  eventTitle={event.title}
                  venue={venue}
                  buyerName={summary.buyerName}
                />
              ))}
            </div>

            {/* Actions : calendrier + renvoi email */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" className="flex-1" onClick={addToCalendar} data-testid="order-add-calendar">
                <CalendarPlus className="h-4 w-4" />
                Ajouter au calendrier
              </Button>
              {buyerEmailMasked ? (
                <Button variant="outline" className="flex-1" onClick={resend} disabled={isPending} data-testid="order-resend-email">
                  {isPending ? (
                    <>
                      <Refresh className="h-4 w-4 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Renvoyer par email
                    </>
                  )}
                </Button>
              ) : null}
            </div>
            {buyerEmailMasked && (
              <p className="text-center text-xs text-muted-foreground">
                Renvoi vers <span className="font-mono">{buyerEmailMasked}</span>
              </p>
            )}

            {/* Retour du renvoi email */}
            {emailFeedback && (
              <p
                role="status"
                className={`flex items-center justify-center gap-1.5 text-center text-sm ${
                  emailFeedback.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {emailFeedback.ok ? (
                  <CheckCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <WarningCircle className="h-4 w-4 shrink-0" />
                )}
                {emailFeedback.text}
              </p>
            )}

            {deliveryMethod === 'download' && (
              <p className="text-center text-xs text-muted-foreground">
                Remise choisie à l'achat : téléchargement direct — vous pouvez aussi renvoyer par email.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

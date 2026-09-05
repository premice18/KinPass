'use client'

// ────────────────────────────────────────────────────────────────────────────
// Tunnel d'achat (Phase 6.2 → 6.4) — route `/e/[slug]/checkout`.
//
// Flux : formulaire (type de billet + jauge réelle, quantité, opérateur
// Mobile Money, coordonnées, remise) → création de la commande `pending` →
// paiement :
//   - clés KPay configurées : push USSD réel (opérateur COD choisi), écran
//     « Validez sur votre téléphone » avec vérification automatique du statut
//     (le webhook `/api/kpay/webhook` marque la commande `paid` et émet les
//     billets) ;
//   - sans clés (démo/E2E) : mode « Simuler le paiement » — la commande est
//     payée immédiatement avec les MÊMES règles (émission des billets + email).
//
// Les montants ne sont JAMAIS pris au client : la Server Action relit prix,
// capacité et devise en base avant d'initier le paiement.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useTransition } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lottie } from 'lottie-react'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Minus,
  Plus,
  Refresh,
  SmartphoneDevice,
  WarningCircle,
} from 'iconoir-react'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Eyebrow } from '@/components/ui/eyebrow'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { IssuedTicketCard } from '@/components/features/checkout/IssuedTicketCard'
import { createOrder, getOrderStatus, initiatePayment, type CreatedOrder } from '@/lib/actions/orders'
import type { EmailDeliveryStatus } from '@/lib/payments'
import { KPAY_COD_PROVIDERS, type KpayCodProviderId } from '@/lib/kpay-providers'
import type { PublicEvent, PublicTicketType } from '@/lib/actions/events'
import type { DeliveryMethod } from '@/lib/validators/orders'
import paymentLoading from '@/public/lottie/payment-loading.json'

interface EventCheckoutProps {
  event: PublicEvent
}

// Étapes du tunnel.
type Step = 'form' | 'awaiting' | 'paid' | 'failed'

// Billet émis (affiché à l'acheteur).
export type PaidTicket = { code: string; ticketTypeName: string }

// Formate un prix selon la devise (affichage acheteur).
function formatPrice(price: number, currency: string): string {
  const amount = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(price)
  return currency === 'CDF' ? `${amount} FC` : `${amount} $`
}

// Date complète (ex. « samedi 20 septembre 2026 à 18:00 »).
function formatFullDate(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export function EventCheckout({ event }: EventCheckoutProps) {
  // ── Sélection : type de billet + quantité ─────────────────────────────────
  const [typeId, setTypeId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)

  // ── Opérateur Mobile Money (RDC) + coordonnées ────────────────────────────
  const [providerId, setProviderId] = useState<KpayCodProviderId>('mpesa')
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')

  // ── Remise du billet (Phase 6.3) : téléchargement direct ou email ────────
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('download')

  // ── Déroulement du paiement ───────────────────────────────────────────────
  const [step, setStep] = useState<Step>('form')
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')
  const [order, setOrder] = useState<CreatedOrder | null>(null)
  // Référence KPay de l'init (écran d'attente).
  const [paymentRef, setPaymentRef] = useState('')
  const [paymentIsTest, setPaymentIsTest] = useState(false)
  // Résultat final (simulé ou via le webhook).
  const [paidTickets, setPaidTickets] = useState<PaidTicket[]>([])
  const [paidSimulated, setPaidSimulated] = useState(false)
  // Statut de la remise email (informatif — le téléchargement reste dispo).
  const [emailStatus, setEmailStatus] = useState<EmailDeliveryStatus | 'pending'>('pending')

  const selectedType = event.ticketTypes.find((type) => type.id === typeId) ?? null
  const isFreeEvent = event.ticketTypes.every((type) => Number(type.price) === 0)

  // Quantité maximale réelle : places restantes (bornée à 20/commande).
  const maxQuantity = (type: PublicTicketType | null): number => {
    if (!type) return 1
    const remaining = type.capacity != null ? type.capacity - type.soldCount : Infinity
    return Math.min(Math.max(1, Math.floor(remaining)), 20)
  }

  const total = selectedType ? Number(selectedType.price) * quantity : 0

  // Validation locale (mêmes règles que le serveur, messages français).
  const clientValidate = (): string | null => {
    if (!selectedType) return 'Choisissez un type de billet.'
    if (buyerName.trim().split(/\s+/).filter(Boolean).length < 2) {
      return 'Indiquez votre nom et votre prénom.'
    }
    if (!/^\+?[0-9][0-9\s-]{7,19}$/.test(buyerPhone.trim())) {
      return 'Numéro de téléphone invalide (format +243 81 000 00 00).'
    }
    if (deliveryMethod === 'email' && !buyerEmail.trim()) {
      return 'L’adresse email est obligatoire pour recevoir vos billets par email.'
    }
    if (buyerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail.trim())) {
      return 'Adresse email invalide.'
    }
    return null
  }

  // Soumission : création de la commande puis lancement du paiement.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const localError = clientValidate()
    if (localError) {
      setFormError(localError)
      return
    }

    startTransition(async () => {
      const created = await createOrder({
        eventId: event.id,
        ticketTypeId: selectedType!.id,
        quantity,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        deliveryMethod,
      })
      if (!created.success) {
        setFormError(created.error)
        return
      }
      setOrder(created.data)

      const payment = await initiatePayment(created.data.orderId, providerId)
      if (!payment.success) {
        setFormError(payment.error)
        setStep('failed')
        return
      }

      if (payment.data.mode === 'simulated') {
        // Paiement simulé : la commande est déjà payée (billets émis).
        setPaidSimulated(true)
        setPaidTickets(payment.data.tickets)
        setEmailStatus(payment.data.emailStatus)
        setStep('paid')
      } else {
        // KPay réel : on attend la confirmation (webhook) sur le téléphone.
        setPaymentRef(payment.data.reference)
        setPaymentIsTest(payment.data.isTest)
        setStep('awaiting')
      }
    })
  }

  // Remonte en haut de page à chaque changement d'écran : le formulaire est
  // long, sans quoi l'utilisateur arrive sur l'écran court (« Paiement
  // confirmé ») avec un grand vide au-dessus (scroll resté en bas).
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  // Vérifie le statut de la commande (polling pendant l'attente du paiement).
  const checkStatus = async (): Promise<void> => {
    if (!order) return
    const result = await getOrderStatus(order.orderId)
    if (!result.success) return
    if (result.data.status === 'paid') {
      setPaidTickets(result.data.tickets ?? [])
      // Confirmé par webhook : l'email a été déclenché côté serveur.
      setEmailStatus(order.deliveryMethod === 'email' ? 'sent' : 'not-requested')
      setStep('paid')
    } else if (result.data.status === 'failed') {
      setStep('failed')
      setFormError('Le paiement a échoué ou a été annulé. Réessayez.')
    }
  }

  // Polling automatique (toutes les 3 s, jusqu'à ~1 min 30) pendant l'attente.
  useEffect(() => {
    if (step !== 'awaiting' || !order) return
    let cancelled = false
    let attempts = 0
    const timer = window.setInterval(async () => {
      attempts += 1
      if (cancelled || attempts > 30) {
        window.clearInterval(timer)
        return
      }
      const result = await getOrderStatus(order.orderId)
      if (cancelled || !result.success) return
      if (result.data.status === 'paid') {
        setPaidTickets(result.data.tickets ?? [])
        setEmailStatus(order.deliveryMethod === 'email' ? 'sent' : 'not-requested')
        setStep('paid')
        window.clearInterval(timer)
      } else if (result.data.status === 'failed') {
        setFormError('Le paiement a échoué ou a été annulé.')
        setStep('failed')
        window.clearInterval(timer)
      }
    }, 3000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [step, order])

  // Retour au formulaire (après échec).
  const backToForm = () => {
    setStep('form')
    setFormError('')
  }

  // ── Écran : paiement confirmé (billets émis) ──────────────────────────────
  if (step === 'paid' && order) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Card data-testid="checkout-success">
            <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
              {/* En-tête compact : pastille de succès (aucun vide parasite) */}
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15"
              >
                <CheckCircle className="h-7 w-7 text-emerald-500" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight">Paiement confirmé</h1>
              <p className="text-muted-foreground">
                Votre commande <span className="font-medium text-foreground">{order.reference}</span> pour{' '}
                <span className="font-medium text-foreground">{order.eventTitle}</span> est payée.
              </p>

              {paidSimulated && (
                <Badge variant="secondary">Mode démo — paiement simulé</Badge>
              )}

              {/* Billets émis : QR + code + téléchargement PDF/PNG/JPG */}
              {paidTickets.length > 0 && (
                <div className="w-full space-y-3 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Vos billets ({paidTickets.length})
                  </p>
                  {paidTickets.map((ticket) => (
                    <IssuedTicketCard
                      key={ticket.code}
                      ticket={ticket}
                      eventTitle={order.eventTitle}
                      venue={[event.venue, event.location].filter(Boolean).join(' · ')}
                      buyerName={buyerName}
                    />
                  ))}
                </div>
              )}

              {/* Remise : email ou téléchargement (le téléchargement reste
                  toujours disponible, même quand l'email a été choisi) */}
              <p className="text-sm text-muted-foreground">
                {order.deliveryMethod === 'email' ? (
                  emailStatus === 'unavailable' || emailStatus === 'failed' ? (
                    <span className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <WarningCircle className="h-4 w-4 shrink-0" />
                      L'envoi par email n'a pas abouti — utilisez le téléchargement ci-dessus.
                    </span>
                  ) : emailStatus === 'sent' ? (
                    `Les billets vous sont envoyés par email (PDF). Vous pouvez aussi les télécharger ci-dessus.`
                  ) : (
                    `Vos billets partent par email (PDF) — téléchargeables aussi ci-dessus.`
                  )
                ) : (
                  "Présentez le QR (ou le code 6 caractères) à l'entrée de l'événement."
                )}
              </p>

              <a
                href={`/e/${order.eventSlug}/checkout/success?order=${order.orderId}`}
                data-testid="checkout-open-success-page"
                className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-2 w-full' })}
              >
                Ouvrir ma page de confirmation
              </a>
              <a
                href={`/e/${order.eventSlug}`}
                className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'mt-1 w-full' })}
              >
                Retour à l'événement
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // ── Écran : en attente de validation du paiement (KPay USSD) ──────────────
  if (step === 'awaiting' && order) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <Lottie src={paymentLoading} loop className="h-20 w-20" />
              <h1 className="text-2xl font-bold tracking-tight">Validez le paiement</h1>
              <p className="text-muted-foreground">
                Une demande de <span className="font-medium text-foreground">{formatPrice(total, selectedType?.currency ?? 'USD')}</span>{' '}
                a été envoyée à <span className="font-medium text-foreground">{buyerPhone}</span>.
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Confirmez la transaction sur votre téléphone (menu Mobile Money). La vérification est
                automatique…
              </p>
              <div className="w-full rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Référence KPay : </span>
                <span className="font-mono font-semibold">{paymentRef}</span>
                {paymentIsTest && (
                  <span className="mt-1 block text-xs text-cyan-600 dark:text-cyan-400">
                    Environnement de test (sandbox KPay)
                  </span>
                )}
              </div>
              <Button variant="outline" className="w-full" onClick={checkStatus} data-testid="checkout-check-status">
                <Refresh className="h-4 w-4" />
                Vérifier maintenant
              </Button>
              <button
                type="button"
                onClick={backToForm}
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Annuler et revenir au formulaire
              </button>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // ── Écran : échec / annulation ────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <WarningCircle className="h-12 w-12 text-destructive" />
              <h1 className="text-2xl font-bold tracking-tight">Paiement non abouti</h1>
              <p className="text-muted-foreground">{formError || 'La transaction a échoué.'}</p>
              <div className="flex w-full flex-col gap-2">
                <Button onClick={backToForm} data-testid="checkout-retry">
                  Réessayer
                </Button>
                {order && (
                  <a
                    href={`/e/${order.eventSlug}`}
                    className={buttonVariants({ variant: 'ghost', className: 'w-full' })}
                  >
                    Retour à l’événement
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // ── Formulaire principal ──────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <a
          href={`/e/${event.slug}`}
          className={buttonVariants({ variant: 'ghost', className: '-ml-3 mb-5' })}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’événement
        </a>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Colonne : récapitulatif de l'événement */}
          <section>
            <Eyebrow>Billetterie</Eyebrow>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl" data-testid="checkout-title">
              {event.title}
            </h1>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              {event.startAt && (
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  {formatFullDate(event.startAt)}
                </p>
              )}
              {(event.venue || event.location) && (
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  {[event.venue, event.location].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            {isFreeEvent && (
              <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4 shrink-0" />
                Événement gratuit : aucun paiement exigé.
              </div>
            )}
          </section>

          {/* Colonne : formulaire de commande */}
          <Card>
            <CardContent className="space-y-6 p-6">
              {formError && (
                <div
                  role="alert"
                  data-testid="form-error"
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <WarningCircle className="h-4 w-4 shrink-0" />
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Types de billets disponibles (jauge réelle) */}
                <fieldset>
                  <legend className="text-sm font-medium">Type de billet</legend>
                  <div className="mt-2.5 space-y-2">
                    {event.ticketTypes.map((type) => {
                      const remaining = type.capacity != null ? type.capacity - type.soldCount : null
                      const unavailable = remaining != null && remaining <= 0
                      const selected = type.id === typeId
                      return (
                        <button
                          key={type.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          disabled={unavailable}
                          onClick={() => {
                            setTypeId(type.id)
                            setQuantity(1)
                          }}
                          data-testid="checkout-type-option"
                          className={cn(
                            'flex w-full items-center justify-between gap-3 rounded-lg border p-3.5 text-left transition-colors',
                            selected
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                              : 'border-border bg-background hover:bg-muted/40',
                            unavailable && 'cursor-not-allowed opacity-50 hover:bg-background',
                          )}
                        >
                          <span>
                            <span className="block font-medium">{type.name}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {unavailable
                                ? 'Complet'
                                : remaining != null
                                  ? `${remaining} place${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`
                                  : 'Places illimitées'}
                            </span>
                          </span>
                          {Number(type.price) === 0 ? (
                            <Badge variant="success">Entrée libre</Badge>
                          ) : (
                            <span className="font-mono text-base font-semibold tabular-nums">
                              {formatPrice(Number(type.price), type.currency)}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                {/* Quantité */}
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3.5">
                  <div>
                    <p className="font-medium">Quantité</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedType && maxQuantity(selectedType) < 20
                        ? `maximum ${maxQuantity(selectedType)} places`
                        : 'jusqu’à 20 par commande'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      aria-label="Diminuer la quantité"
                      variant="outline"
                      size="icon"
                      type="button"
                      disabled={quantity <= 1 || !selectedType}
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-semibold tabular-nums" data-testid="checkout-quantity">
                      {quantity}
                    </span>
                    <Button
                      aria-label="Augmenter la quantité"
                      variant="outline"
                      size="icon"
                      type="button"
                      disabled={!selectedType || quantity >= maxQuantity(selectedType)}
                      onClick={() => setQuantity((q) => q + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Opérateur Mobile Money (RD Congo, Phase 6.4) */}
                <fieldset>
                  <legend className="text-sm font-medium">Payer avec</legend>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                    {KPAY_COD_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        role="radio"
                        aria-checked={providerId === p.id}
                        onClick={() => setProviderId(p.id)}
                        data-testid={`checkout-provider-${p.id}`}
                        className={cn(
                          'rounded-lg border p-3 text-center transition-colors',
                          providerId === p.id
                            ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                            : 'border-border bg-background hover:bg-muted/40',
                        )}
                      >
                        <span className="block text-sm font-medium">{p.shortLabel}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Remise du billet (Phase 6.3) */}
                <fieldset>
                  <legend className="text-sm font-medium">Comment recevoir vos billets</legend>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={deliveryMethod === 'download'}
                      onClick={() => setDeliveryMethod('download')}
                      data-testid="checkout-delivery-download"
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        deliveryMethod === 'download'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border bg-background hover:bg-muted/40',
                      )}
                    >
                      <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border">
                        {deliveryMethod === 'download' && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span>
                        <span className="block font-medium">Télécharger maintenant</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          PDF, PNG ou JPG à la confirmation
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={deliveryMethod === 'email'}
                      onClick={() => setDeliveryMethod('email')}
                      data-testid="checkout-delivery-email"
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                        deliveryMethod === 'email'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-border bg-background hover:bg-muted/40',
                      )}
                    >
                      <span aria-hidden="true" className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border">
                        {deliveryMethod === 'email' && <span className="h-2 w-2 rounded-full bg-primary" />}
                      </span>
                      <span>
                        <span className="block font-medium">Recevoir par email</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Votre billet en pièce jointe (PDF)
                        </span>
                      </span>
                    </button>
                  </div>
                </fieldset>

                {/* Coordonnées acheteur */}
                <div className="space-y-4">
                  <Field label="Nom complet">
                    <Input
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Ex. Jean-Marc Kabongo"
                      autoComplete="name"
                      aria-required="true"
                      data-testid="checkout-buyer-name"
                    />
                  </Field>
                  <Field label="Numéro de téléphone (Mobile Money)">
                    <Input
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+243 81 000 00 00"
                      type="tel"
                      autoComplete="tel"
                      aria-required="true"
                      data-testid="checkout-buyer-phone"
                    />
                  </Field>
                  <Field
                    label={
                      deliveryMethod === 'email'
                        ? 'Adresse email (pour recevoir vos billets)'
                        : 'Adresse email (optionnelle)'
                    }
                  >
                    <Input
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="jean@exemple.cd"
                      type="email"
                      autoComplete="email"
                      aria-required={deliveryMethod === 'email'}
                      data-testid="checkout-buyer-email"
                    />
                  </Field>
                </div>

                {/* Total + soumission */}
                <div className="flex items-center justify-between border-t border-dashed border-border pt-5">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono text-2xl font-bold tabular-nums" data-testid="checkout-total">
                    {selectedType ? formatPrice(total, selectedType.currency) : '—'}
                  </span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isPending || !selectedType}
                      data-testid="checkout-submit"
                    >
                      {isPending ? (
                        <>
                          <Refresh className="h-4 w-4 animate-spin" />
                          {isFreeEvent ? 'Création de la commande…' : 'Initiation du paiement…'}
                        </>
                      ) : (
                        <>
                          <SmartphoneDevice className="h-4 w-4" />
                          {isFreeEvent ? 'Confirmer ma participation' : 'Payer via Mobile Money'}
                        </>
                      )}
                    </Button>
                  </motion.div>
                </AnimatePresence>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  M-Pesa (Vodacom) · Orange Money · Airtel Money — RD Congo
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Étiquette de champ (label + contenu).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

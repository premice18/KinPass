'use client'

// ────────────────────────────────────────────────────────────────────────────
// Tunnel d'achat (Phase 6.2) — route `/e/[slug]/checkout`.
//
// L'acheteur choisit un type de billet (jauge réelle affichée : places
// restantes calculées depuis la base), une quantité, puis saisit ses
// coordonnées (nom, téléphone Mobile Money, email optionnel). Le total est
// calculé côté client pour l'affichage MAIS les montants sont re-vérifiés par
// la Server Action `createOrder` (prix et capacité relus en base).
//
// À la soumission : création d'une commande `pending` (order + order_items).
// La confirmation de paiement (webhook Mobile Money, Phase 6.4) fera passer
// la commande à `paid` et générera les billets (codes + QR) ; la remise
// email/téléchargement (PDF/PNG/JPG) est la Phase 6.3.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
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
import { createOrder, type CreatedOrder } from '@/lib/actions/orders'
import type { PublicEvent, PublicTicketType } from '@/lib/actions/events'
import type { DeliveryMethod } from '@/lib/validators/orders'

interface EventCheckoutProps {
  event: PublicEvent
}

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

  // ── Coordonnées de l'acheteur ─────────────────────────────────────────────
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')

  // ── Remise du billet (Phase 6.3) : téléchargement direct ou email ────────
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('download')

  // ── Soumission (transition serveur) ───────────────────────────────────────
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')
  const [order, setOrder] = useState<CreatedOrder | null>(null)

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

  // Soumission : validation locale puis appel de la Server Action.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    const localError = clientValidate()
    if (localError) {
      setFormError(localError)
      return
    }

    startTransition(async () => {
      const result = await createOrder({
        eventId: event.id,
        ticketTypeId: selectedType!.id,
        quantity,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim() || undefined,
        deliveryMethod,
      })
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setOrder(result.data)
    })
  }

  // ── Écran de confirmation (commande pending) ──────────────────────────────
  if (order) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Card data-testid="checkout-success">
            <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <h1 className="text-2xl font-bold tracking-tight">Commande enregistrée</h1>
              <p className="text-muted-foreground">
                Votre commande <span className="font-medium text-foreground">{order.reference}</span> pour{' '}
                <span className="font-medium text-foreground">{order.eventTitle}</span> est bien reçue.
              </p>

              {/* Récapitulatif */}
              <div className="w-full space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-left text-sm">
                <Row label="Billet" value={`${order.quantity} × ${order.ticketTypeName}`} />
                <Row
                  label="Prix unitaire"
                  value={formatPrice(Number(order.unitPrice), order.currency)}
                />
                <Row label="Total" value={formatPrice(Number(order.totalAmount), order.currency)} strong />
                <Row
                  label="Remise"
                  value={order.deliveryMethod === 'email' ? 'Envoi par email' : 'Téléchargement direct'}
                />
                <Row label="Statut" value="En attente de paiement" />
              </div>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <SmartphoneDevice className="h-3.5 w-3.5" />
                Le paiement Mobile Money et la remise de vos billets arrivent très bientôt.
              </p>

              <a
                href={`/e/${order.eventSlug}`}
                className={buttonVariants({ variant: 'outline', size: 'lg', className: 'mt-2 w-full' })}
              >
                Retour à l’événement
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

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
                      Création de la commande…
                    </>
                  ) : (
                    <>
                      <SmartphoneDevice className="h-4 w-4" />
                      {isFreeEvent ? 'Confirmer ma participation' : 'Payer via Mobile Money'}
                    </>
                  )}
                </Button>
                <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  M-Pesa · Orange Money · Airtel Money
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

// Ligne du récapitulatif de confirmation.
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('text-right font-mono', strong && 'text-base font-bold text-foreground')}>{value}</span>
    </div>
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

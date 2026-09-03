'use client'

// ────────────────────────────────────────────────────────────────────────────
// Formulaire de création / édition d'événement (Phase 5)
//
// - Champs généraux : titre, description, catégorie, lieu, dates, affiche (URL).
// - Types de billets dynamiques : ajout / suppression de lignes
//   (nom, prix, devise USD/CDF, capacité).
// - Validation côté client (mêmes règles que les schémas Zod du serveur),
//   puis appel des Server Actions `createEvent` / `updateEvent` via
//   `useTransition` (React 19) pour l'état de chargement.
// - Mode édition : la prop `initialData` pré-remplit les champs.
//
// Navigation : l'application fonctionne par état (SPA) — la prop
// `onNavigateBack` ramène au tableau de bord après succès ou annulation.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { ArrowLeft, CheckCircle, Plus, Refresh, Trash, WarningCircle } from 'iconoir-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { createEvent, updateEvent, type EditableEvent } from '@/lib/actions/events'
import { EVENT_CATEGORIES, TICKET_CURRENCIES, type EventCategory, type TicketCurrency } from '@/lib/constants'

interface EventCreationFormProps {
  // Retour au tableau de bord (après succès ou annulation).
  onNavigateBack: () => void
  // Présent en mode édition : pré-remplit le formulaire et déclenche
  // `updateEvent` au lieu de `createEvent`.
  initialData?: EditableEvent
}

// Ligne de type de billet en cours de saisie (la clé sert d'identifiant React).
type TicketTypeDraft = {
  key: string
  name: string
  price: string
  currency: TicketCurrency
  capacity: string
}

// Classe partagée pour les <select> et <textarea> (mêmes styles que <Input>).
const fieldClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

// Crée une clé unique (timestamp + aléa) pour une nouvelle ligne de billet.
function makeTicketKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Convertit une valeur Date/string en valeur « datetime-local » pour l'input
// (conversion dans le fuseau local de l'utilisateur).
function toLocalInputValue(value: Date | string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function EventCreationForm({ onNavigateBack, initialData }: EventCreationFormProps) {
  // ── Champs généraux (pré-remplis en mode édition) ─────────────────────────
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [category, setCategory] = useState<EventCategory | ''>(
    initialData?.category ? (initialData.category as EventCategory) : '',
  )
  // Type d'événement personnalisé, affiché uniquement si catégorie = « Autre ».
  const [categoryCustom, setCategoryCustom] = useState(initialData?.categoryCustom ?? '')
  const [venue, setVenue] = useState(initialData?.venue ?? '')
  const [location, setLocation] = useState(initialData?.location ?? '')
  const [startAt, setStartAt] = useState(() => toLocalInputValue(initialData?.startAt ?? null))
  const [endAt, setEndAt] = useState(() => toLocalInputValue(initialData?.endAt ?? null))
  const [posterUrl, setPosterUrl] = useState(initialData?.posterUrl ?? '')

  // ── Types de billets (dynamiques) ─────────────────────────────────────────
  const [ticketTypes, setTicketTypes] = useState<TicketTypeDraft[]>(() => {
    if (initialData && initialData.ticketTypes.length > 0) {
      return initialData.ticketTypes.map((t) => ({
        key: t.id,
        name: t.name,
        price: String(t.price),
        currency: (t.currency === 'CDF' ? 'CDF' : 'USD') as TicketCurrency,
        capacity: t.capacity != null ? String(t.capacity) : '',
      }))
    }
    return [{ key: makeTicketKey(), name: 'Standard', price: '', currency: 'USD', capacity: '' }]
  })

  // ── État de soumission ────────────────────────────────────────────────────
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const isEditing = Boolean(initialData)

  // Ajoute une ligne de type de billet vierge.
  const addTicketType = () => {
    setTicketTypes((prev) => [...prev, { key: makeTicketKey(), name: '', price: '', currency: 'USD', capacity: '' }])
  }

  // Retire une ligne de type de billet (au moins une ligne reste).
  const removeTicketType = (key: string) => {
    setTicketTypes((prev) => (prev.length > 1 ? prev.filter((t) => t.key !== key) : prev))
  }

  // Met à jour une propriété d'une ligne de billet.
  const updateTicketType = (key: string, patch: Partial<TicketTypeDraft>) => {
    setTicketTypes((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)))
  }

  // Validation côté client : mêmes règles que les schémas Zod serveur
  // (messages d'erreur en français). Retourne null si tout est valide.
  const clientValidate = (): string | null => {
    if (title.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères.'
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
      return 'La date de fin doit être postérieure à la date de début.'
    }
    if (category === 'Autre' && !categoryCustom.trim()) return 'Précisez le type d’événement.'
    if (ticketTypes.length === 0) return 'Ajoutez au moins un type de billet.'
    for (const t of ticketTypes) {
      if (!t.name.trim()) return 'Chaque type de billet doit avoir un nom.'
      if (t.capacity !== '' && Number(t.capacity) < 1) {
        return 'La capacité doit être d’au moins 1.'
      }
    }
    return null
  }

  // Construit l'objet d'entrée attendu par les Server Actions : les champs
  // vides deviennent `undefined`, les dates sont converties en objets Date
  // (sérialisables par les Server Actions).
  const buildInput = () => ({
    title: title.trim(),
    description: description.trim() || undefined,
    category: category || undefined,
    // Le type personnalisé n'est envoyé que si la catégorie est « Autre ».
    categoryCustom: category === 'Autre' ? categoryCustom.trim() : undefined,
    venue: venue.trim() || undefined,
    location: location.trim() || undefined,
    startAt: startAt ? new Date(startAt) : undefined,
    endAt: endAt ? new Date(endAt) : undefined,
    posterUrl: posterUrl.trim() || undefined,
    ticketTypes: ticketTypes.map((t) => ({
      name: t.name.trim(),
      price: Number(t.price),
      currency: t.currency,
      capacity: t.capacity !== '' ? Number(t.capacity) : undefined,
    })),
  })

  // Soumission : validation locale puis appel de la Server Action adaptée
  // (createEvent ou updateEvent selon le mode) dans une transition.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setSuccessMessage('')

    const localError = clientValidate()
    if (localError) {
      setFormError(localError)
      return
    }

    startTransition(async () => {
      const result = isEditing && initialData
        ? await updateEvent(initialData.id, buildInput())
        : await createEvent(buildInput())

      if (!result.success) {
        setFormError(result.error)
        return
      }

      setSuccessMessage(isEditing ? 'Événement mis à jour avec succès.' : 'Événement créé avec succès.')
      // Retour au tableau de bord : la liste sera rechargée à la visite.
      onNavigateBack()
    })
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" className="-ml-3 mb-5" onClick={onNavigateBack}>
          <ArrowLeft className="h-4 w-4" />
          Retour au tableau de bord
        </Button>

        <Card>
          <CardHeader>
            <Eyebrow>{isEditing ? 'MODIFIER L’ÉVÉNEMENT' : 'NOUVEL ÉVÉNEMENT'}</Eyebrow>
            <CardTitle className="text-2xl">
              {isEditing ? 'Modifier l’événement' : 'Créer un événement'}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Présentez votre événement et définissez vos billets.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Message de succès (vert) */}
              {successMessage && (
                <div
                  role="status"
                  data-testid="form-success"
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {successMessage}
                </div>
              )}

              {/* Message d'erreur global (rouge) */}
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

              {/* Informations générales */}
              <div className="space-y-5">
                <Field label="Titre de l’événement">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex. Kin House : Open Studio"
                    aria-required="true"
                    data-testid="event-title-input"
                  />
                </Field>

                <Field label="Catégorie">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EventCategory | '')}
                    className={fieldClass}
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Champ « Type d'événement » : visible uniquement si Autre */}
                {category === 'Autre' && (
                  <Field label="Type d’événement">
                    <Input
                      value={categoryCustom}
                      onChange={(e) => setCategoryCustom(e.target.value)}
                      placeholder="Ex. Projection cinéma, Foire, Tournoi…"
                      data-testid="event-category-custom-input"
                    />
                  </Field>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Début de l’événement">
                    <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                  </Field>
                  <Field label="Fin de l’événement">
                    <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Lieu">
                    <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Ex. Galerie d’art moderne" />
                  </Field>
                  <Field label="Localisation">
                    <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex. Kinshasa, Gombe" />
                  </Field>
                </div>

                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`${fieldClass} min-h-28`}
                    placeholder="Décrivez votre événement..."
                  />
                </Field>

                {/*
                  Affiche : champ URL pour le MVP. Aucun stockage externe
                  (Supabase Storage / Vercel Blob) n'étant encore configuré,
                  on saisit une URL d'image hébergée ailleurs ; l'upload
                  viendra dans une phase ultérieure.
                */}
                <Field label="Affiche (URL)">
                  <Input
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    placeholder="https://.../affiche.jpg"
                    type="url"
                  />
                </Field>
              </div>

              {/* Types de billets */}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Types de billets</p>
                    <p className="text-sm text-muted-foreground">Définissez les prix et capacités.</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addTicketType} data-testid="add-ticket-type">
                    <Plus className="h-4 w-4" />
                    Ajouter un type
                  </Button>
                </div>

                <div className="mt-4 space-y-3">
                  {ticketTypes.map((ticket, index) => (
                    <div
                      key={ticket.key}
                      data-testid="ticket-type-row"
                      className="rounded-lg border border-border bg-background p-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Billet {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeTicketType(ticket.key)}
                          aria-label={`Supprimer le billet ${index + 1}`}
                          data-testid="remove-ticket-type"
                          disabled={ticketTypes.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Nom">
                          <Input
                            value={ticket.name}
                            onChange={(e) => updateTicketType(ticket.key, { name: e.target.value })}
                            placeholder="Ex. Standard, VIP, Invitation"
                          />
                        </Field>
                        <Field label="Prix">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticket.price}
                            onChange={(e) => updateTicketType(ticket.key, { price: e.target.value })}
                            placeholder="0"
                          />
                        </Field>
                        <Field label="Devise">
                          <select
                            value={ticket.currency}
                            onChange={(e) =>
                              updateTicketType(ticket.key, { currency: e.target.value as TicketCurrency })
                            }
                            className={fieldClass}
                          >
                            {TICKET_CURRENCIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Capacité">
                          <Input
                            type="number"
                            min="1"
                            value={ticket.capacity}
                            onChange={(e) => updateTicketType(ticket.key, { capacity: e.target.value })}
                            placeholder="Ex. 500"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons d'action : retour à la ligne autorisé sur mobile */}
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isPending} className="min-w-44" data-testid="submit-event-button">
                  {isPending ? (
                    <>
                      <Refresh className="h-4 w-4 animate-spin" />
                      {isEditing ? 'Enregistrement…' : 'Création…'}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {isEditing ? 'Enregistrer les modifications' : 'Créer l’événement'}
                    </>
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={onNavigateBack} disabled={isPending}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

// Petit composant d'étiquette de champ réutilisable (label + contenu).
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

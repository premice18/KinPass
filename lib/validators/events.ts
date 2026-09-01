// ────────────────────────────────────────────────────────────────────────────
// Schémas de validation Zod — Événements (Phase 5)
//
// Séparés des Server Actions (`lib/actions/events.ts`) car un fichier
// "use server" ne peut exporter que des fonctions async : les schémas sont
// des objets et doivent donc vivre dans ce module dédié, importable à la fois
// par le serveur (actions) et par le client (types inférés).
// Messages d'erreur en français.
// ────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

import { EVENT_CATEGORIES, TICKET_CURRENCIES } from '@/lib/constants'

// Les champs de date/heure arrivent du client au format « datetime-local »
// (ex. "2026-09-20T14:30") : `z.coerce.date()` les convertit en objets Date.
export const ticketTypeSchema = z.object({
  name: z.string().trim().min(1, 'Le nom du billet est obligatoire.').max(100, 'Le nom du billet est trop long (100 caractères max).'),
  price: z.coerce.number().min(0, 'Le prix ne peut pas être négatif.').max(999_999_999, 'Le prix est trop élevé.'),
  currency: z.enum(TICKET_CURRENCIES, { error: 'La devise doit être USD ou CDF.' }),
  capacity: z.coerce
    .number()
    .int('La capacité doit être un nombre entier.')
    .min(1, 'La capacité doit être d’au moins 1.')
    .max(100_000_000, 'La capacité est trop élevée.')
    .optional(),
})

// Type d'une ligne de type de billet validée (utilisé côté Server Actions).
export type TicketTypeInput = z.infer<typeof ticketTypeSchema>

// Base commune des champs d'un événement (sans refine : Zod 4 interdit
// `.partial()` sur un schéma qui contient un `.refine()` — on applique donc
// la contrainte de dates sur chacun des schémas finaux).
const baseEventSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit contenir au moins 3 caractères.').max(255, 'Le titre est trop long (255 caractères max).'),
  description: z.string().trim().max(10_000, 'La description est trop longue.').optional(),
  category: z.enum(EVENT_CATEGORIES, { error: 'Catégorie invalide.' }).optional(),
  // Type personnalisé, obligatoire uniquement si la catégorie est « Autre ».
  categoryCustom: z.string().trim().max(100, 'Le type d’événement est trop long (100 caractères max).').optional(),
  venue: z.string().trim().max(255, 'Le lieu est trop long (255 caractères max).').optional(),
  location: z.string().trim().max(255, 'La localisation est trop longue (255 caractères max).').optional(),
  startAt: z.coerce.date({ error: 'Date de début invalide.' }).optional(),
  endAt: z.coerce.date({ error: 'Date de fin invalide.' }).optional(),
  posterUrl: z.union([z.url({ error: "URL de l'affiche invalide." }), z.literal('')]).optional(),
  ticketTypes: z.array(ticketTypeSchema).min(1, 'Ajoutez au moins un type de billet.'),
})

// Contrainte partagée : la date de fin doit être postérieure à la date de début
// (vérifiée uniquement si les deux dates sont fournies).
const eventDateOrderRefine = (d: { startAt?: Date; endAt?: Date }) =>
  !d.startAt || !d.endAt || d.endAt > d.startAt

// Contrainte partagée : si la catégorie est « Autre », le type personnalisé
// doit être renseigné.
const eventCustomCategoryRefine = (d: { category?: (typeof EVENT_CATEGORIES)[number]; categoryCustom?: string }) =>
  d.category !== 'Autre' || (d.categoryCustom ?? '').trim().length > 0

// Entrée de création : titre obligatoire, au moins un type de billet.
export const createEventSchema = baseEventSchema
  .refine(eventDateOrderRefine, {
    message: 'La date de fin doit être postérieure à la date de début.',
    path: ['endAt'],
  })
  .refine(eventCustomCategoryRefine, {
    message: 'Précisez le type d’événement.',
    path: ['categoryCustom'],
  })

export type CreateEventInput = z.infer<typeof createEventSchema>

// Entrée de mise à jour : tous les champs sont optionnels (on ne modifie que ce
// qui est fourni). Si `ticketTypes` est fourni, l'ensemble des types de billets
// est remplacé intégralement (voir `updateEvent` pour la règle de sécurité).
export const updateEventSchema = baseEventSchema
  .partial()
  .refine(eventDateOrderRefine, {
    message: 'La date de fin doit être postérieure à la date de début.',
    path: ['endAt'],
  })
  .refine(eventCustomCategoryRefine, {
    message: 'Précisez le type d’événement.',
    path: ['categoryCustom'],
  })

export type UpdateEventInput = z.infer<typeof updateEventSchema>

// Extrait le premier message d'erreur Zod (les issues sont ordonnées par champ).
export function firstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

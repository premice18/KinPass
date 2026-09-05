// ────────────────────────────────────────────────────────────────────────────
// Schémas de validation Zod — Commandes (Phase 6.2)
//
// Validation des données saisies par l'acheteur sur `/e/[slug]/checkout`.
// Les prix/capacités ne sont JAMAIS pris au client : la Server Action relit
// les tarifs et jauges en base (source de vérité). Messages en français.
// ────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

// Numéro de téléphone Mobile Money (format international libre : chiffres,
// +, espaces, tirets — 8 à 20 caractères significatifs).
export const phoneSchema = z
  .string()
  .trim()
  .min(8, 'Le numéro de téléphone est trop court.')
  .max(20, 'Le numéro de téléphone est trop long.')
  .regex(/^\+?[0-9][0-9\s-]{7,19}$/, 'Numéro de téléphone invalide (format +243 81 000 00 00).')

// Saisie du tunnel d'achat : un type de billet + quantité + coordonnées.
export const checkoutSchema = z
  .object({
    eventId: z.string().uuid('Événement invalide.'),
    ticketTypeId: z.string().uuid('Type de billet invalide.'),
    quantity: z
      .number()
      .int('La quantité doit être un nombre entier.')
      .min(1, 'Choisissez au moins un billet.')
      .max(20, 'Quantité maximale par commande : 20.'),
    buyerName: z
      .string()
      .trim()
      .min(2, 'Le nom complet est obligatoire.')
      .max(255, 'Le nom est trop long (255 caractères max).'),
    buyerPhone: phoneSchema,
    // Email optionnel (reçu + re-téléchargement du billet).
    buyerEmail: z.union([z.string().trim().email('Adresse email invalide.'), z.literal('')]).optional(),
  })
  .refine((data) => data.buyerName.split(/\s+/).filter(Boolean).length >= 2, {
    message: 'Indiquez votre nom et votre prénom.',
    path: ['buyerName'],
  })

export type CheckoutInput = z.infer<typeof checkoutSchema>

// Extrait le premier message d'erreur Zod (les issues sont ordonnées par champ).
export function firstZodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

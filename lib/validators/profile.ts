// ────────────────────────────────────────────────────────────────────────────
// Schémas de validation Zod — Profil organisateur (Phase 4.3)
//
// Messages d'erreur en français. `updateProfileSchema` valide les champs du
// profil (avatar, WhatsApp, adresse, bio, site, réseau) ;
// `addPayoutMethodSchema` valide un compte de reversement (utilisé aussi pour
// sa modification).
// ────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

// Providers de reversement acceptés (Mobile Money + banque).
export const PAYOUT_PROVIDERS = ['mpesa', 'airtel_money', 'orange_money', 'bank'] as const
export type PayoutProvider = (typeof PAYOUT_PROVIDERS)[number]

// Avatar accepté : URL http(s), OU image importée de l'appareil (data-URL
// redimensionnée côté client, format webp/png/jpeg). Taille plafonnée.
const avatarUrlSchema = z
  .string()
  .trim()
  .max(700_000, 'Image trop lourde (limite 700 Ko).')
  .refine(
    (v) =>
      v === '' ||
      /^https?:\/\//i.test(v) ||
      /^data:image\/(png|jpe?g|webp);base64,/i.test(v),
    { message: "URL d'avatar invalide." },
  )

// Mise à jour du profil organisateur (tous les champs optionnels).
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Le nom complet est obligatoire.').max(255).optional(),
  phoneWhatsapp: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ()-]{8,25}$/, 'Numéro WhatsApp invalide (format international, ex. +243812345678).')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(255, 'L’adresse est trop longue.').optional().or(z.literal('')),
  bio: z.string().trim().max(300, 'La bio est limitée à 300 caractères.').optional().or(z.literal('')),
  website: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\/.+\..+/.test(v), { message: 'URL de site invalide (ex. https://…).' })
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .trim()
    .refine((v) => v === '' || /^@?[a-zA-Z0-9._]{1,30}$/.test(v), { message: 'Pseudo Instagram invalide.' })
    .optional()
    .or(z.literal('')),
  avatarUrl: avatarUrlSchema.optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// Ajout / modification d'un compte de reversement.
export const addPayoutMethodSchema = z.object({
  provider: z.enum(PAYOUT_PROVIDERS, { error: 'Fournisseur invalide.' }),
  accountName: z.string().trim().min(2, 'Le nom du titulaire est obligatoire.'),
  accountNumber: z.string().trim().min(5, 'Numéro de compte invalide.').max(50),
})

export type AddPayoutMethodInput = z.infer<typeof addPayoutMethodSchema>

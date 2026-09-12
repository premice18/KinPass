// ────────────────────────────────────────────────────────────────────────────
// Schémas de validation Zod — Authentification (phase 4.1)
//
// Messages d'erreur en français. `loginSchema` et `registerSchema` sont
// utilisés côté serveur (actions) et leurs règles sont reflétées côté client.
// ────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

// Mot de passe : 8 caractères minimum, une majuscule, une minuscule, un chiffre.
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule.')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule.')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre.')

// Connexion : email + mot de passe non vide.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
})

export type LoginInput = z.infer<typeof loginSchema>

// Inscription organisateur : identité, mot de passe confirmé, acceptation des
// CGU obligatoire (le contrat complet arrivera en Phase 11).
export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
    fullName: z.string().trim().min(2, 'Le nom complet est obligatoire.'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirmez le mot de passe.'),
    acceptTerms: z.literal(true, { error: 'Vous devez accepter les Conditions Générales.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

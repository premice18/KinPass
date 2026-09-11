'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Action — Formulaire de contact (Phase 11.1).
//
// Reçoit un message public (page /legal/contact), le valide, applique un
// rate-limit par email (anti-spam simple) et l'envoie à la boîte kinPass
// (`MAIL_CONTACT`, repli `contact@premicekombozi.com` — domaine vérifié).
// L'adresse de l'utilisateur est placée en `replyTo` : l'équipe répond
// directement depuis sa boîte mail.
// ────────────────────────────────────────────────────────────────────────────

import { z } from 'zod'

import { sendContactEmail } from '@/lib/mail'
import { isRateLimited, recordAttempt } from '@/lib/rate-limit'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Indiquez votre nom (2 caractères minimum).').max(255, 'Nom trop long.'),
  email: z.string().trim().email('Adresse email invalide.').max(255, 'Email trop long.'),
  subject: z.enum(['bug', 'organisateur', 'acheteur', 'partenariat', 'autre'], {
    error: 'Choisissez un sujet.',
  }),
  message: z
    .string()
    .trim()
    .min(10, 'Votre message est trop court (10 caractères minimum).')
    .max(5000, 'Message trop long (5000 caractères maximum).'),
})

export type ContactInput = z.infer<typeof contactSchema>

// Libellés français des sujets (affichés dans l'email).
const SUBJECT_LABELS: Record<ContactInput['subject'], string> = {
  bug: 'Bug / problème technique',
  organisateur: 'Question organisateur',
  acheteur: 'Question acheteur / billet',
  partenariat: 'Partenariat',
  autre: 'Autre',
}

// Fenêtre anti-spam : 3 messages / 10 minutes par adresse email.
const WINDOW_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 3

export async function sendContactMessage(
  input: ContactInput,
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }
  const data = parsed.data
  const emailKey = `contact:${data.email.toLowerCase()}`

  if (isRateLimited(emailKey, MAX_ATTEMPTS, WINDOW_MS)) {
    return {
      success: false,
      error: 'Trop de messages envoyés récemment. Réessayez dans quelques minutes.',
    }
  }

  const result = await sendContactEmail({
    name: data.name,
    email: data.email,
    subject: SUBJECT_LABELS[data.subject],
    message: data.message,
  })

  // En développement (sans clé Resend), l'envoi est simulé (log serveur) mais
  // on affiche l'accusé : le formulaire reste utilisable en local.
  // En production sans clé configurée, on refuse honnêtement (aucun message
  // ne doit être silencieusement perdu).
  if (!result.ok) {
    if (process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY) {
      return { success: true }
    }
    return {
      success: false,
      error: "L'envoi n'est pas disponible pour le moment. Écrivez-nous directement par email.",
    }
  }

  recordAttempt(emailKey, WINDOW_MS)
  return { success: true }
}

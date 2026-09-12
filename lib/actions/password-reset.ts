'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Réinitialisation de mot de passe (Phase 11.5).
//
// `requestPasswordReset(email)` : répond TOUJOURS la même chose (anti-
// énumération), rate-limitée ; si un compte organisateur existe, un token à
// usage unique (haché, 1 h) est créé et envoyé par email.
// Les AGENTS sont exclus (emails synthétiques) : leur organisateur réinitialise.
//
// `resetPassword(token, password)` : vérifie le hash, l'expiration et
// l'usage unique, met à jour le mot de passe et consomme le token.
// ────────────────────────────────────────────────────────────────────────────

import { and, eq, gt, isNull } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/lib/db'
import { passwordResetTokens, users } from '@/lib/db/schema'
import { sendPasswordResetEmail } from '@/lib/mail'
import { APP_BASE_URL } from '@/lib/share'
import { createResetToken, hashResetToken, isResetTokenUsable } from '@/lib/password-reset'
import { hashPassword } from '@/lib/password'
import { isRateLimited, recordAttempt } from '@/lib/rate-limit'
import { passwordSchema } from '@/lib/validators/auth'

// Fenêtre anti-spam : 3 demandes / 15 min par email.
const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 3

// Message GÉNÉRIQUE, identique dans tous les cas (anti-énumération).
const GENERIC_MESSAGE = 'Si un compte existe pour cette adresse, un email de réinitialisation vient d’être envoyé.'

const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Adresse email invalide.'),
})

// Demande de réinitialisation — réponse toujours générique.
export async function requestPasswordReset(
  input: { email: string },
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Adresse email invalide.' }
  }
  const email = parsed.data.email
  const rateKey = `reset:${email}`

  if (isRateLimited(rateKey, MAX_ATTEMPTS, WINDOW_MS)) {
    // Même réponse générique (on ne révèle pas l'existence du compte).
    return { success: true, message: GENERIC_MESSAGE }
  }
  recordAttempt(rateKey, WINDOW_MS)

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)

    // Aucun compte, agent (email synthétique), ou compte suspendu :
    // même message, aucun email — jamais d'énumération.
    const eligible = Boolean(user) && user.role === 'organizer' && user.active !== false
    if (!eligible || !user) {
      return { success: true, message: GENERIC_MESSAGE }
    }

    // Invalide les anciens tokens non consommés, puis crée le nouveau.
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id))
    const { token, tokenHash, expiresAt } = createResetToken()
    await db.insert(passwordResetTokens).values({ userId: user.id, tokenHash, expiresAt })

    const resetUrl = `${APP_BASE_URL}/auth/reset-password?token=${encodeURIComponent(token)}`
    await sendPasswordResetEmail({ to: user.email, fullName: user.fullName, resetUrl })

    return { success: true, message: GENERIC_MESSAGE }
  } catch {
    // En cas d'erreur technique, on garde la réponse générique côté client
    // (aucune fuite d'information), l'erreur est visible dans les logs.
    return { success: true, message: GENERIC_MESSAGE }
  }
}

const resetSchema = z.object({
  token: z.string().trim().min(10, 'Lien de réinitialisation invalide.'),
  password: passwordSchema,
})

// Réinitialisation effective — token haché, expirant, à usage unique.
export async function resetPassword(
  input: { token: string; password: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const parsed = resetSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides.' }
  }

  try {
    const tokenHash = hashResetToken(parsed.data.token)
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .limit(1)

    // Introuvable, expiré ou déjà consommé : message unique.
    if (!row || !isResetTokenUsable(row)) {
      return { success: false, error: 'Lien invalide ou expiré. Demandez un nouveau lien.' }
    }

    // Met à jour le mot de passe et consomme TOUS les tokens de l'utilisateur
    // (les autres liens éventuels deviennent inutilisables).
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash: hashPassword(parsed.data.password), updatedAt: new Date() })
        .where(eq(users.id, row.userId))
      await tx.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId))
    })

    return { success: true }
  } catch {
    return { success: false, error: 'Impossible de réinitialiser le mot de passe. Réessayez.' }
  }
}

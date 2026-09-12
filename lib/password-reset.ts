// ────────────────────────────────────────────────────────────────────────────
// Helpers purs — réinitialisation de mot de passe (Phase 11.5).
//
// Aucune dépendance applicative : génération du token, hachage (sha256),
// expiration. Testables unitairement (tests/unit/password-reset.test.ts).
// ────────────────────────────────────────────────────────────────────────────

import { createHash, randomBytes } from 'node:crypto'

// Durée de validité d'un lien de réinitialisation (1 heure).
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

// Hache un token en sha256 hex (64 caractères) — seule forme stockée en base.
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}

// Génère un token aléatoire (32 octets, base64url) + son hash + son expiration.
export function createResetToken(now: Date = new Date()): {
  token: string
  tokenHash: string
  expiresAt: Date
} {
  const token = randomBytes(32).toString('base64url')
  return {
    token,
    tokenHash: hashResetToken(token),
    expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MS),
  }
}

// Vrai si le token est expiré (à `now`).
export function isResetTokenExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime()
}

// Vrai si le token est encore utilisable (non expiré, non consommé).
export function isResetTokenUsable(
  row: { expiresAt: Date; usedAt: Date | null },
  now: Date = new Date(),
): boolean {
  return row.usedAt === null && !isResetTokenExpired(row.expiresAt, now)
}

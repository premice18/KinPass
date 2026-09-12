// Tests unitaires — helpers de réinitialisation de mot de passe (Phase 11.5).
import { describe, expect, it } from 'vitest'

import {
  createResetToken,
  hashResetToken,
  isResetTokenExpired,
  isResetTokenUsable,
  RESET_TOKEN_TTL_MS,
} from '@/lib/password-reset'

describe('hashResetToken', () => {
  it('produit un sha256 hex (64 caractères) déterministe', () => {
    const hash = hashResetToken('mon-token-secret')
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hashResetToken('mon-token-secret')).toBe(hash)
  })

  it('ne stocke jamais le token en clair (hash différent du token)', () => {
    const token = 'abcdef'
    expect(hashResetToken(token)).not.toBe(token)
  })
})

describe('createResetToken', () => {
  it('génère un token aléatoire, son hash et une expiration à 1 h', () => {
    const now = new Date('2026-09-01T10:00:00.000Z')
    const { token, tokenHash, expiresAt } = createResetToken(now)
    expect(token.length).toBeGreaterThanOrEqual(40)
    expect(tokenHash).toBe(hashResetToken(token))
    expect(expiresAt.getTime()).toBe(now.getTime() + RESET_TOKEN_TTL_MS)
  })

  it('génère des tokens variés (pas de collision sur 100 tirages)', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => createResetToken().token))
    expect(tokens.size).toBe(100)
  })
})

describe('expiration & usage unique', () => {
  const now = new Date('2026-09-01T10:00:00.000Z')

  it('détecte un token expiré', () => {
    expect(isResetTokenExpired(new Date(now.getTime() - 1000), now)).toBe(true)
    expect(isResetTokenExpired(new Date(now.getTime() + 1000), now)).toBe(false)
  })

  it('refuse un token consommé ou expiré, accepte un token valide', () => {
    const future = new Date(now.getTime() + 60_000)
    expect(isResetTokenUsable({ expiresAt: future, usedAt: null }, now)).toBe(true)
    expect(isResetTokenUsable({ expiresAt: future, usedAt: now }, now)).toBe(false)
    expect(isResetTokenUsable({ expiresAt: new Date(now.getTime() - 1), usedAt: null }, now)).toBe(false)
  })
})

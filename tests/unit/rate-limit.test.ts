// Tests unitaires — rate limiting en mémoire (lib/rate-limit).
import { describe, expect, it } from 'vitest'

import { clearAttempts, isRateLimited, recordAttempt } from '@/lib/rate-limit'

// Petite fenêtre pour tester l'expiration sans attendre.
const WINDOW = 30

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('rate-limit en mémoire', () => {
  it('ne limite pas une clé inconnue', () => {
    expect(isRateLimited('clef-inconnue', 3, WINDOW)).toBe(false)
  })

  it('limite après le nombre maximal de tentatives', () => {
    const key = `test-limit-${Date.now()}`
    recordAttempt(key, 5000)
    recordAttempt(key, 5000)
    expect(isRateLimited(key, 2, 5000)).toBe(true)
    expect(isRateLimited(key, 3, 5000)).toBe(false)
  })

  it('réinitialise les tentatives après effacement (succès)', () => {
    const key = `test-clear-${Date.now()}`
    recordAttempt(key, 5000)
    recordAttempt(key, 5000)
    clearAttempts(key)
    expect(isRateLimited(key, 1, 5000)).toBe(false)
  })

  it('oublie les tentatives après expiration de la fenêtre', async () => {
    const key = `test-expire-${Date.now()}`
    recordAttempt(key, WINDOW)
    expect(isRateLimited(key, 1, WINDOW)).toBe(true)
    await sleep(WINDOW + 15)
    expect(isRateLimited(key, 1, WINDOW)).toBe(false)
  })
})

// Tests unitaires — codes de billet (lib/ticket-code).
import { describe, expect, it } from 'vitest'

import { generateTicketCode, normalizeTicketCode } from '@/lib/ticket-code'

const SAFE_CHARS = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789')

describe('generateTicketCode', () => {
  it('génère un code au format XXX-XXX (7 caractères, 6 significatifs)', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateTicketCode()
      expect(code).toMatch(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/)
      expect(code.length).toBe(7)
    }
  })

  it("n'utilise jamais les caractères ambigus (0/O/1/I)", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateTicketCode()
      for (const char of code.replace('-', '')) {
        expect(SAFE_CHARS.has(char)).toBe(true)
      }
    }
  })

  it('génère des codes variés (pas de doublon sur 200 tirages)', () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateTicketCode()))
    expect(codes.size).toBe(200)
  })
})

describe('normalizeTicketCode', () => {
  it('met en majuscules et ignore tirets/espaces', () => {
    expect(normalizeTicketCode('a4b-8k9')).toBe('A4B-8K9')
    expect(normalizeTicketCode(' k9m4x2 ')).toBe('K9M-4X2')
    expect(normalizeTicketCode('a4b8k9')).toBe('A4B-8K9')
  })

  it('gère une saisie partielle (reformatage progressif)', () => {
    expect(normalizeTicketCode('a4b')).toBe('A4B')
    expect(normalizeTicketCode('a4b8')).toBe('A4B-8')
  })

  it('ignore les caractères non alphanumériques', () => {
    expect(normalizeTicketCode('A4B-8K9!?')).toBe('A4B-8K9')
  })
})

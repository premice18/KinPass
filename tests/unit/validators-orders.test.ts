// Tests unitaires — validateurs des commandes (lib/validators/orders).
import { describe, expect, it } from 'vitest'

import { checkoutSchema } from '@/lib/validators/orders'

const validInput = {
  eventId: '00000000-0000-4000-8000-000000000001',
  ticketTypeId: '00000000-0000-4000-8000-000000000002',
  quantity: 2,
  buyerName: 'Jean-Marc Kabongo',
  buyerPhone: '+243 81 234 56 78',
  deliveryMethod: 'download' as const,
}

describe('checkoutSchema', () => {
  it('accepte une commande valide (téléchargement, sans email)', () => {
    const result = checkoutSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepte une commande valide avec email (remise email)', () => {
    const result = checkoutSchema.safeParse({ ...validInput, deliveryMethod: 'email', buyerEmail: 'jean@exemple.cd' })
    expect(result.success).toBe(true)
  })

  it('exige un email quand la remise est « email »', () => {
    const result = checkoutSchema.safeParse({ ...validInput, deliveryMethod: 'email' })
    expect(result.success).toBe(false)
    expect(result.success === false && result.error.issues[0]?.path[0]).toBe('buyerEmail')
  })

  it('refuse un téléphone trop court', () => {
    const result = checkoutSchema.safeParse({ ...validInput, buyerPhone: '12' })
    expect(result.success).toBe(false)
  })

  it('refuse un nom à un seul mot', () => {
    const result = checkoutSchema.safeParse({ ...validInput, buyerName: 'Jean' })
    expect(result.success).toBe(false)
  })

  it('refuse une quantité à 0', () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 0 })
    expect(result.success).toBe(false)
  })

  it('refuse une quantité > 20', () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 21 })
    expect(result.success).toBe(false)
  })

  it('refuse un email mal formé', () => {
    const result = checkoutSchema.safeParse({ ...validInput, buyerEmail: 'pas-un-email' })
    expect(result.success).toBe(false)
  })

  it('accepte des noms de participants (un par billet)', () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      quantity: 2,
      attendees: ['Aline Mbala', 'David Ilunga'],
    })
    expect(result.success).toBe(true)
  })

  it('refuse un nombre de noms différent de la quantité', () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 3, attendees: ['Aline Mbala'] })
    expect(result.success).toBe(false)
  })

  it('refuse un nom de participant vide', () => {
    const result = checkoutSchema.safeParse({ ...validInput, quantity: 2, attendees: ['Aline Mbala', '  '] })
    expect(result.success).toBe(false)
  })
})

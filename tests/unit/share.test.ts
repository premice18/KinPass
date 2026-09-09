// Tests unitaires — helpers de partage (lib/share).
import { describe, expect, it } from 'vitest'

import {
  buildEventUrl,
  buildFacebookShareUrl,
  buildShareText,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
} from '@/lib/share'

const event = { slug: 'kin-house-open-studio', title: 'Kin House : Open Studio', venue: 'Galerie d’art moderne' }

describe('buildEventUrl', () => {
  it("construit l'URL canonique /e/[slug]", () => {
    const url = buildEventUrl(event)
    expect(url).toMatch(/\/e\/kin-house-open-studio$/)
  })
})

describe('buildShareText', () => {
  it('assemble titre + lieu (sans date si absente)', () => {
    expect(buildShareText(event)).toBe('Kin House : Open Studio — Galerie d’art moderne')
  })

  it("ajoute la date si fournie (français)", () => {
    const withDate = { ...event, startAt: new Date('2026-09-20T18:00:00') }
    expect(buildShareText(withDate)).toContain('20 sept.')
  })
})

describe('builders des canaux', () => {
  it('WhatsApp : wa.me/?text= pré-rempli', () => {
    const url = buildWhatsAppShareUrl('Bonjour le monde')
    expect(url).toBe('https://wa.me/?text=' + encodeURIComponent('Bonjour le monde'))
  })

  it('X : intent avec texte et url', () => {
    const url = buildXShareUrl('Texte', 'https://kinpass.test/e/x')
    expect(url).toContain('https://twitter.com/intent/tweet')
    expect(url).toContain(encodeURIComponent('https://kinpass.test/e/x'))
  })

  it('Facebook : sharer avec u=', () => {
    expect(buildFacebookShareUrl('https://kinpass.test/e/x')).toContain('sharer.php?u=')
  })

  it('Telegram : t.me/share/url', () => {
    const url = buildTelegramShareUrl('Texte', 'https://kinpass.test/e/x')
    expect(url).toContain('https://t.me/share/url')
    expect(url).toContain('url=')
  })
})

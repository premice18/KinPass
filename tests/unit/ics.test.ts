// Tests unitaires — calendrier .ics (lib/ticket/ics).
import { describe, expect, it } from 'vitest'

import { buildEventIcs } from '@/lib/ticket/ics'

const base = {
  title: 'Kin House : Open Studio',
  startAt: new Date('2026-09-20T18:00:00.000Z'),
  endAt: new Date('2026-09-20T23:00:00.000Z'),
  location: 'Kinshasa, Gombe',
  uid: 'kinpass-123@kinpass.app',
}

describe('buildEventIcs', () => {
  it('génère un fichier VCALENDAR valide avec les blocs requis', () => {
    const ics = buildEventIcs(base)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics).toContain(`UID:${base.uid}`)
    expect(ics).toContain('DTSTART:20260920T180000Z')
    expect(ics).toContain('DTEND:20260920T230000Z')
    expect(ics).toContain('SUMMARY:Kin House : Open Studio')
  })

  it('échappe la virgule de la localisation', () => {
    expect(buildEventIcs(base)).toContain('LOCATION:Kinshasa\\, Gombe')
  })

  it('retours ligne CRLF (RFC 5545)', () => {
    expect(buildEventIcs(base)).toContain('\r\n')
  })

  it("fixe une fin par défaut si absente (+3 h)", () => {
    const { endAt: _endAt, ...withoutEnd } = base
    const ics = buildEventIcs({ ...withoutEnd, endAt: null })
    expect(ics).toContain('DTEND:20260920T210000Z')
  })
})

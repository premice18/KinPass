// ────────────────────────────────────────────────────────────────────────────
// Fichier « Ajouter au calendrier » (.ics, Phase 6.5).
//
// Génère un événement iCalendar (RFC 5545) minimal, téléchargé côté client.
// Aucune dépendance : le blob est construit en local.
// ────────────────────────────────────────────────────────────────────────────

// Échappe les caractères réservés iCal (virgule, point-virgule, retour ligne).
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// Formate une date en UTC basique iCal (YYYYMMDDTHHMMSSZ).
function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

interface EventIcsData {
  title: string
  description?: string
  startAt: Date
  endAt?: Date | null
  location?: string
  url?: string
  uid: string
}

// Construit le contenu d'un fichier .ics (CRLF obligatoire en RFC 5545).
export function buildEventIcs(data: EventIcsData): string {
  const start = new Date(data.startAt)
  const end = data.endAt ? new Date(data.endAt) : new Date(start.getTime() + 3 * 60 * 60 * 1000)
  const now = new Date()

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//kinPass//Billetterie RDC//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(data.uid)}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(data.title)}`,
    data.description ? `DESCRIPTION:${escapeIcs(data.description)}` : null,
    data.location ? `LOCATION:${escapeIcs(data.location)}` : null,
    data.url ? `URL:${escapeIcs(data.url)}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter((line): line is string => line !== null)

  return `${lines.join('\r\n')}\r\n`
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers de partage d'un événement (Phase 6.1, enrichis en 6.7).
//
// L'URL canonique d'un événement est construite depuis son slug :
// `${NEXT_PUBLIC_APP_URL}/e/${slug}`. Pas de raccourcisseur tiers au MVP
// (dépendance externe + coût + lien mort potentiel) — cf. plan §4.6.7.
//
// Repli si la variable n'est pas renseignée : l'hôte local de développement.
// NB : types structurels uniquement (aucun import de la base) — ce module est
// importé côté client (page publique événement).
// ────────────────────────────────────────────────────────────────────────────

// URL publique du site (base de tous les liens partageables et aperçus OG).
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// Construit l'URL publique d'un événement (`/e/[slug]`).
export function buildEventUrl(event: { slug: string }): string {
  return `${APP_BASE_URL}/e/${event.slug}`
}

// Formate la date courte d'un événement pour le texte de partage
// (ex. « 20 sept. 2026 à 18:00 »), en français.
function formatShareDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

// Construit le texte de partage (titre + date + lieu + URL) utilisé pour
// WhatsApp et les réseaux sociaux.
export function buildShareText(event: {
  title: string
  startAt?: Date | string | null
  venue?: string | null
}): string {
  const parts = [event.title]
  const date = formatShareDate(event.startAt)
  if (date) parts.push(date)
  if (event.venue) parts.push(event.venue)
  return parts.join(' — ')
}

// Lien de partage WhatsApp (canal roi en RDC) avec le texte pré-rempli.
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

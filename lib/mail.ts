// ────────────────────────────────────────────────────────────────────────────
// Envoi d'emails (Phase 6.3) — remise du billet par email.
//
// Provider configurable : Resend si `RESEND_API_KEY` est renseignée. Sans clé
// (développement), l'envoi est simulé : un log clair évite tout comportement
// silencieux. L'appelant décide du traitement (l'envoi réel du billet aura
// lieu à la confirmation du paiement, Phase 6.4).
//
// NB : le SDK Resend est chargé à la volée (`import()` dynamique) pour ne pas
// alourdir le bundle tant que la clé n'est pas configurée.
// ────────────────────────────────────────────────────────────────────────────

import 'server-only'

import { Resend } from 'resend'

import { renderTicketEmailHtml, renderTicketEmailText } from '@/lib/email-templates'

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

interface TicketEmailPayload {
  to: string
  buyerName: string
  eventTitle: string
  // Lignes du récapitulatif (type + code de chaque billet).
  tickets: Array<{ ticketTypeName: string; code: string }>
  // Un PDF par billet (pièces jointes).
  attachments: Array<{ fileName: string; pdfBuffer: Uint8Array }>
  // Lien vers la page publique de l'événement (optionnel).
  eventUrl?: string
}

// Expéditeur par défaut — TEMPORAIRE : `premicekombozi.com` est le seul
// domaine VÉRIFIÉ chez Resend aujourd'hui. Dès que `kinpass.com` (ou
// `kinpass.app`) sera vérifié, définir `MAIL_FROM` dans l'environnement
// (ex. `kinPass <billets@kinpass.com>`) — sinon Resend refuse l'envoi
// (« application_error : Unable to fetch data »).
const DEFAULT_FROM = 'kinPass <billets@premicekombozi.com>'

// Adresse de contact par défaut (Phase 11.1) — le seul domaine vérifié
// aujourd'hui est `premicekombozi.com` ; basculer vers `contact@kinpass.com`
// quand ce domaine sera vérifié (env `MAIL_CONTACT`).
export const DEFAULT_CONTACT_ADDRESS = 'contact@premicekombozi.com'

// ── Email de contact (formulaire /legal/contact) ────────────────────────────

interface ContactEmailPayload {
  // Nom de l'expéditeur (affiché dans le corps).
  name: string
  // Adresse de l'utilisateur → `replyTo` (répondre écrit directement à lui).
  email: string
  subject: string
  message: string
  // Provenance éventuelle (page, événement…).
  context?: string
}

// Envoie un message du formulaire de contact vers la boîte kinPass.
// L'adresse de l'utilisateur est en `replyTo` (jamais comme expéditeur).
export async function sendContactEmail(payload: ContactEmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const contactAddress = process.env.MAIL_CONTACT ?? DEFAULT_CONTACT_ADDRESS

  if (!apiKey) {
    console.warn(
      `[mail] Contact simulé (RESEND_API_KEY absente) → ${contactAddress} — de ${payload.name} <${payload.email}> : « ${payload.subject} »`,
    )
    return { ok: false, error: 'Email non configuré (développement).' }
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? DEFAULT_FROM,
      to: contactAddress,
      replyTo: payload.email,
      subject: `[Contact kinPass] ${payload.subject}`,
      html: `
        <p><strong>Nouveau message depuis le site kinPass</strong></p>
        <p><strong>Nom :</strong> ${escapeHtml(payload.name)}<br/>
        <strong>Email :</strong> ${escapeHtml(payload.email)}<br/>
        <strong>Sujet :</strong> ${escapeHtml(payload.subject)}</p>
        <hr/>
        <p style="white-space:pre-wrap">${escapeHtml(payload.message)}</p>
        ${payload.context ? `<hr/><p style="color:#64748B;font-size:12px">Contexte : ${escapeHtml(payload.context)}</p>` : ''}
      `,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Envoi impossible.' }
  }
}

// Échappe les valeurs saisies (injection HTML dans l'email).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Envoie un billet (PDF) en pièce jointe. En développement sans `RESEND_API_KEY`,
// l'email est loggé et l'appelant en est informé (`ok: false`).
export async function sendTicketEmail(payload: TicketEmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Développement : pas de vrai envoi, mais un log explicite et non muet.
    const names = payload.attachments.map((a) => a.fileName).join(', ')
    const bytes = payload.attachments.reduce((sum, a) => sum + a.pdfBuffer.byteLength, 0)
    console.warn(
      `[mail] Email simulé (RESEND_API_KEY absente) → ${payload.to} — « ${payload.eventTitle} », pièces jointes ${names} (${bytes} octets au total).`,
    )
    return { ok: false, error: 'Email non configuré (développement).' }
  }

  try {
    const resend = new Resend(apiKey)

    // Rendu du corps (HTML inline + texte brut) depuis les données réelles.
    const emailData = {
      buyerName: payload.buyerName,
      eventTitle: payload.eventTitle,
      tickets: payload.tickets,
      eventUrl: payload.eventUrl,
    }

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? DEFAULT_FROM,
      to: payload.to,
      subject: `Vos billets — ${payload.eventTitle}`,
      html: renderTicketEmailHtml(emailData),
      text: renderTicketEmailText(emailData),
      attachments: payload.attachments.map((attachment) => ({
        filename: attachment.fileName,
        content: Buffer.from(attachment.pdfBuffer),
      })),
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Envoi email impossible.' }
  }
}

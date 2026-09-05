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

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

interface TicketEmailPayload {
  to: string
  eventTitle: string
  buyerName: string
  // Un PDF par billet (pièces jointes).
  attachments: Array<{ fileName: string; pdfBuffer: Uint8Array }>
}

// Expéditeur par défaut (à remplacer par un domaine vérifié en production).
const DEFAULT_FROM = 'kinPass <billets@kinpass.app>'

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

    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? DEFAULT_FROM,
      to: payload.to,
      subject: `Vos billets — ${payload.eventTitle}`,
      html: `
        <p>Bonjour ${payload.buyerName},</p>
        <p>Merci pour votre achat. Retrouvez vos billets pour
        <strong>${payload.eventTitle}</strong> en pièces jointes.</p>
        <p>Présentez le QR code (ou le code de 6 caractères) à l'entrée de
        l'événement.</p>
        <p>L'équipe kinPass</p>`,
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

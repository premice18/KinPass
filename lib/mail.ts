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

export type SendEmailResult =
  | { ok: true; id: string | null }
  | { ok: false; error: string }

interface TicketEmailPayload {
  to: string
  eventTitle: string
  buyerName: string
  // PDF du billet (Uint8Array → Buffer pour la pièce jointe).
  pdfBuffer: Uint8Array
  fileName: string
}

// Expéditeur par défaut (à remplacer par un domaine vérifié en production).
const DEFAULT_FROM = 'kinPass <billets@kinpass.app>'

// Envoie un billet (PDF) en pièce jointe. En développement sans `RESEND_API_KEY`,
// l'email est loggé et l'appelant en est informé (`ok: false`).
export async function sendTicketEmail(payload: TicketEmailPayload): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    // Développement : pas de vrai envoi, mais un log explicite et non muet.
    console.warn(
      `[mail] Email simulé (RESEND_API_KEY absente) → ${payload.to} — « ${payload.eventTitle} », pièce jointe ${payload.fileName} (${payload.pdfBuffer.byteLength} octets).`,
    )
    return { ok: false, error: 'Email non configuré (développement).' }
  }

  try {
    // Chargement paresseux par nom dynamique : le SDK n'est résolu ni par le
    // bundler (Next) ni par TypeScript tant qu'il n'est pas installé —
    // `pnpm add resend` dès qu'une clé RESEND_API_KEY est configurée.
    const moduleName = 'resend'
    const resendModule = (await import(moduleName)) as {
      Resend: new (apiKey: string) => {
        emails: {
          send: (payload: {
            from: string
            to: string
            subject: string
            html: string
            attachments?: Array<{ filename: string; content: Buffer }>
          }) => Promise<{ data: { id: string } | null; error: { message: string } | null }>
        }
      }
    }
    const resend = new resendModule.Resend(apiKey)

    const attachment = Buffer.from(payload.pdfBuffer)
    const { data, error } = await resend.emails.send({
      from: process.env.MAIL_FROM ?? DEFAULT_FROM,
      to: payload.to,
      subject: `Vos billets — ${payload.eventTitle}`,
      html: `
        <p>Bonjour ${payload.buyerName},</p>
        <p>Merci pour votre achat. Retrouvez votre billet pour
        <strong>${payload.eventTitle}</strong> en pièce jointe.</p>
        <p>Présentez le QR code (ou le code de 6 caractères) à l'entrée de
        l'événement.</p>
        <p>L'équipe kinPass</p>`,
      attachments: [{ filename: payload.fileName, content: attachment }],
    })

    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id ?? null }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Envoi email impossible.' }
  }
}

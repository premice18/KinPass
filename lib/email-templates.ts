// ────────────────────────────────────────────────────────────────────────────
// Rendu des emails transactionnels kinPass (remise des billets).
//
// Décision : l'email vit DANS LE CODE (et non dans un template Resend) —
// versionné, testable, sans double source de vérité. Styles INLINE (compatibles
// Gmail/Outlook), mise en page simple, + une version TEXTE BRUT pour les
// clients de messagerie sans HTML.
// ────────────────────────────────────────────────────────────────────────────

// Échappe les caractères HTML (nom d'acheteur saisi par l'utilisateur, etc.).
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface TicketEmailData {
  buyerName: string
  eventTitle: string
  // Un billet par ligne (type + code) — le PDF est joint par l'API.
  tickets: Array<{ ticketTypeName: string; code: string }>
  // Lien vers la page publique de l'événement (optionnel).
  eventUrl?: string
}

// Rendu HTML (styles inline uniquement — aucune feuille externe).
export function renderTicketEmailHtml(data: TicketEmailData): string {
  const name = escapeHtml(data.buyerName)
  const event = escapeHtml(data.eventTitle)

  const ticketsHtml = data.tickets
    .map(
      (ticket) => `
        <tr>
          <td style="padding:0 0 10px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
              style="border:1px solid #E2E8F0;border-left:4px solid #06B6D4;border-radius:8px;background:#FFFFFF;">
              <tr>
                <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;">
                  <div style="font-size:12px;color:#64748B;text-transform:uppercase;letter-spacing:1px;">
                    ${escapeHtml(ticket.ticketTypeName)}
                  </div>
                  <div style="font-size:20px;font-weight:bold;color:#0F172A;font-family:monospace;letter-spacing:2px;margin-top:4px;">
                    ${escapeHtml(ticket.code)}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join('')

  const eventLink = data.eventUrl
    ? `
      <tr>
        <td style="padding:16px 0 0 0;text-align:center;">
          <a href="${escapeHtml(data.eventUrl)}"
             style="color:#2563EB;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;">
            Voir l'événement
          </a>
        </td>
      </tr>`
    : ''

  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#F1F5F9;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <!-- En-tête sombre kinPass -->
            <tr>
              <td style="background:#0F172A;border-radius:12px 12px 0 0;padding:24px 28px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#06B6D4;letter-spacing:1px;">
                  kinPass
                </div>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#64748B;margin-top:4px;">
                  Billetterie sécurisée — RD Congo
                </div>
              </td>
            </tr>
            <!-- Corps -->
            <tr>
              <td style="background:#FFFFFF;padding:28px;border-radius:0 0 12px 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0F172A;line-height:1.6;">
                      Bonjour <strong>${name}</strong>,<br/>
                      Merci pour votre achat. Retrouvez vos billets pour
                      <strong>${event}</strong> en pièces jointes.
                    </td>
                  </tr>
                  <tr><td style="height:20px;"></td></tr>
                  ${ticketsHtml}
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#64748B;line-height:1.6;padding-top:8px;">
                      Présentez le QR code (ou le code à 6 caractères) à l'entrée de
                      l'événement, depuis votre téléphone ou cette impression.
                    </td>
                  </tr>
                  ${eventLink}
                  <tr>
                    <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94A3B8;padding-top:24px;border-top:1px dashed #E2E8F0;">
                      L'équipe kinPass — une question ? Répondez simplement à cet email.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

// Version texte brut (clients sans HTML).
export function renderTicketEmailText(data: TicketEmailData): string {
  const lines = [
    `Bonjour ${data.buyerName},`,
    '',
    `Merci pour votre achat. Vos billets pour ${data.eventTitle} sont en pièces jointes :`,
    '',
    ...data.tickets.map((ticket) => `- ${ticket.ticketTypeName} : ${ticket.code}`),
    '',
    "Présentez le QR code (ou le code à 6 caractères) à l'entrée de l'événement.",
    data.eventUrl ? `Voir l'événement : ${data.eventUrl}` : '',
    '',
    "L'équipe kinPass",
  ]
  return lines.filter((line) => line !== '').join('\n')
}

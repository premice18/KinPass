// ────────────────────────────────────────────────────────────────────────────
// Route DEV — test d'envoi d'email (diagnostic Resend).
//
// `GET /api/dev/test-email?to=delivered@resend.dev`
//
// Envoie un email de démonstration (mêmes fonctions que la remise des
// billets : template HTML + pièce jointe PDF) et renvoie le résultat exact
// de l'API Resend. Sert à distinguer :
//   1. configuration absente (RESEND_API_KEY non définie) ;
//   2. domaine `MAIL_FROM` non vérifié (erreur Resend explicite) ;
//   3. erreur de rendu/pièce jointe.
// Désactivée en production (outil de développement uniquement).
// ────────────────────────────────────────────────────────────────────────────

import { renderTicketEmailHtml, renderTicketEmailText } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Jamais exposée en production (évite tout abus d'envoi).
  if (process.env.NODE_ENV === 'production') {
    return new Response('Route de développement uniquement.', { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const to = searchParams.get('to') ?? 'delivered@resend.dev'

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return Response.json({ ok: false, error: 'RESEND_API_KEY absente — ajoutez-la puis redémarrez.' })
  }

  const from = process.env.MAIL_FROM ?? 'kinPass <onboarding@resend.dev>'

  try {
    // SDK importé à la volée uniquement pour cette route de diagnostic.
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const sample = {
      buyerName: 'Test kinPass',
      eventTitle: 'Kin House : Open Studio',
      tickets: [{ ticketTypeName: 'VIP', code: 'K9M-4X2' }],
      eventUrl: 'https://kinpass.app/e/kin-house-open-studio',
    }

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: `[test] Vos billets — ${sample.eventTitle}`,
      html: renderTicketEmailHtml(sample),
      text: renderTicketEmailText(sample),
    })

    if (error) {
      // Cause la plus probable : domaine `from` non vérifié sur Resend.
      return Response.json({ ok: false, from, to, error: error.message })
    }
    return Response.json({ ok: true, from, to, id: data?.id ?? null })
  } catch (err) {
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue.' })
  }
}

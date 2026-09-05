import { buildTicketPdf } from '@/lib/ticket/pdf'

// ────────────────────────────────────────────────────────────────────────────
// Route DEV — aperçu d'un billet (Phase 6.3).
//
// Génère le PDF d'un billet de démonstration via le MÊME moteur que la
// production (lib/ticket/pdf.ts) pour valider le rendu dans le navigateur
// sans passer par un paiement : `GET /api/dev/ticket-preview?code=K9M-4X2`.
// ────────────────────────────────────────────────────────────────────────────

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = (searchParams.get('code') ?? 'K9M-4X2').toUpperCase()

  // Données de démonstration — le vrai billet sera construit depuis la
  // commande payée (Phase 6.4/6.5).
  const artwork = {
    code,
    eventTitle: 'Kin House : Open Studio',
    eventDateLabel: 'samedi 20 septembre 2026 à 18:00',
    venue: 'Galerie d’art moderne · Kinshasa, Gombe',
    ticketTypeName: 'VIP',
    buyerName: 'Jean-Marc Kabongo',
    orderReference: '537D1C83',
  }

  try {
    const pdf = await buildTicketPdf(artwork)
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="kinpass-billet-${code}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Erreur de génération du billet PDF :', err)
    return new Response('Génération du billet impossible.', { status: 500 })
  }
}

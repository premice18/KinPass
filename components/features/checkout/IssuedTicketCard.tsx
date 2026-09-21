'use client'

// ────────────────────────────────────────────────────────────────────────────
// Carte d'un billet émis, affichée après paiement (Phase 6.4/6.5).
//
// Chaque billet est présenté avec son QR (généré côté client via `qrcode` —
// la valeur encodée est le code 6 caractères, validée en base au scan) et ses
// actions de remise, disponibles QUEL QUE SOIT le mode choisi à l'achat :
//   - PDF  : route serveur `/api/tickets/[code]/pdf` (moteur react-pdf) ;
//   - PNG / JPG : export canvas local (aucune dépendance serveur).
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'iconoir-react'

import { downloadTicketImage } from '@/lib/ticket/image-export'
import type { PaidTicket } from './EventCheckout'

interface IssuedTicketCardProps {
  ticket: PaidTicket
  eventTitle: string
  venue: string
  buyerName: string
}

export function IssuedTicketCard({ ticket, eventTitle, venue, buyerName }: IssuedTicketCardProps) {
  // QR en dataURL (PNG) généré côté client — code du billet encodé.
  const [qr, setQr] = useState('')

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL(ticket.code, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        if (!cancelled) setQr(dataUrl)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [ticket.code])

  // Téléchargements PDF/PNG/JPG — toujours proposés (remise « email » incluse).
  const download = useCallback(
    (format: 'pdf' | 'png' | 'jpg') => {
      if (format === 'pdf') {
        // Le PDF est généré côté serveur (moteur react-pdf) puis téléchargé.
        const link = document.createElement('a')
        link.href = `/api/tickets/${encodeURIComponent(ticket.code)}/pdf`
        link.download = `kinpass-${ticket.code}.pdf`
        document.body.appendChild(link)
        link.click()
        link.remove()
        return
      }
      if (!qr) return
      void downloadTicketImage(
        qr,
        { code: ticket.code, eventTitle, venue, ticketTypeName: ticket.ticketTypeName, buyerName },
        format === 'png' ? 'png' : 'jpeg',
      )
    },
    [qr, ticket, eventTitle, venue, buyerName],
  )

  return (
    <div
      data-testid="paid-ticket"
      className="overflow-hidden rounded-lg border border-border bg-background"
    >
      {/* Liseré haut cyan + en-tête */}
      <div className="h-1.5 bg-gradient-to-r from-primary to-cyan-400" />
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
            Billet numérique
          </p>
          <p className="mt-1 truncate font-semibold">{eventTitle}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ticket.ticketTypeName} — code{' '}
            <span className="font-mono font-semibold tracking-[0.15em]" data-testid="paid-ticket-code">
              {ticket.code}
            </span>
          </p>
        </div>

        {/* QR (dataURL PNG généré côté client) */}
        <div className="shrink-0">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt={`QR code du billet ${ticket.code}`}
              data-testid="paid-ticket-qr"
              className="h-20 w-20 rounded-md border border-border bg-white p-1"
            />
          ) : (
            <div className="h-20 w-20 animate-pulse rounded-md border border-border bg-muted" aria-hidden="true" />
          )}
        </div>
      </div>

      {/* Actions de remise : PDF / PNG / JPG — disponibles dans tous les cas */}
      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-border bg-muted/30 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Download className="h-3.5 w-3.5" />
          Télécharger :
        </span>
        <ButtonPill onClick={() => download('pdf')} label="PDF" />
        <ButtonPill onClick={() => download('png')} label="PNG" />
        <ButtonPill onClick={() => download('jpg')} label="JPG" />
      </div>
    </div>
  )
}

// Petit bouton pilule des formats de téléchargement.
function ButtonPill({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-6 items-center gap-1 rounded-[3px] border border-border bg-background px-2 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:border-primary hover:text-primary"
    >
      {label}
    </button>
  )
}

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

import type { PaidTicket } from './EventCheckout'

interface IssuedTicketCardProps {
  ticket: PaidTicket
  eventTitle: string
  venue: string
  buyerName: string
}

// ── Export PNG / JPG d'une carte billet (canvas, côté client) ───────────────

// Dessine la carte billet sur un canvas puis déclenche le téléchargement.
async function downloadTicketImage(
  qrDataUrl: string,
  artwork: { code: string; eventTitle: string; venue: string; ticketTypeName: string; buyerName: string },
  format: 'png' | 'jpeg',
): Promise<void> {
  const scale = 2 // rendu net sur écrans haute densité
  const width = 860 * scale
  const height = 500 * scale
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.scale(scale, scale)
  // Fond blanc + liseré haut cyan (rappel du talon kinPass)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, 860, 500)
  ctx.fillStyle = '#06B6D4'
  ctx.fillRect(0, 0, 860, 8)

  // Zone gauche : informations
  ctx.fillStyle = '#0F172A'
  ctx.font = '600 14px system-ui, sans-serif'
  ctx.fillText('KINPASS — BILLET NUMÉRIQUE', 48, 64)

  // Titre (tronqué si trop long)
  ctx.font = '700 34px system-ui, sans-serif'
  let title = artwork.eventTitle
  while (title.length > 0 && ctx.measureText(title).width > 460) title = `${title.slice(0, -2)}…`
  ctx.fillText(title, 48, 130)

  ctx.fillStyle = '#475569'
  ctx.font = '400 19px system-ui, sans-serif'
  const meta = [artwork.venue].filter(Boolean).join(' · ')
  ctx.fillText(meta.length > 60 ? `${meta.slice(0, 58)}…` : meta, 48, 168)

  // Talon perforé (ligne pointillée)
  ctx.strokeStyle = '#E2E8F0'
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(48, 210)
  ctx.lineTo(500, 210)
  ctx.stroke()
  ctx.setLineDash([])

  // Billet / Acheteur
  const drawRow = (label: string, value: string, y: number) => {
    ctx.fillStyle = '#94A3B8'
    ctx.font = '600 12px system-ui, sans-serif'
    ctx.fillText(label.toUpperCase(), 48, y)
    ctx.fillStyle = '#0F172A'
    ctx.font = '600 21px system-ui, sans-serif'
    let v = value
    while (v.length > 0 && ctx.measureText(v).width > 300) v = `${v.slice(0, -2)}…`
    ctx.fillText(v, 48, y + 28)
  }
  drawRow('Billet', artwork.ticketTypeName, 250)
  drawRow('Acheteur', artwork.buyerName, 320)

  // Talon sombre droit : QR + code
  ctx.fillStyle = '#0F172A'
  ctx.fillRect(560, 8, 300, 492)
  ctx.fillStyle = '#64748B'
  ctx.font = '600 11px system-ui, sans-serif'
  ctx.fillText('CODE D’ACCÈS', 585, 64)

  ctx.fillStyle = '#06B6D4'
  ctx.font = '700 26px monospace'
  ctx.fillText(artwork.code, 585, 110)

  // QR (image chargée depuis le dataURL PNG généré par `qrcode`)
  const qr = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('QR illisible'))
    image.src = qrDataUrl
  })
  const qrSize = 190
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(585, 150, qrSize + 40, qrSize + 40)
  ctx.drawImage(qr, 605, 170, qrSize, qrSize)

  ctx.fillStyle = '#64748B'
  ctx.font = '400 13px system-ui, sans-serif'
  ctx.fillText('Présentez ce QR ou le code à l’entrée.', 585, 410)

  // Téléchargement via un lien temporaire
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, `image/${format}`, 0.92))
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `kinpass-${artwork.code}.${format === 'jpeg' ? 'jpg' : 'png'}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

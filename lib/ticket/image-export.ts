// ────────────────────────────────────────────────────────────────────────────
// Export PNG / JPG d'une carte billet (canvas, côté client).
//
// Extrait d'IssuedTicketCard pour être réutilisé par la page publique
// « Vérifier mon billet » (Phase 12) — aucune dépendance serveur.
// ────────────────────────────────────────────────────────────────────────────

export interface TicketImageArtwork {
  code: string
  eventTitle: string
  venue: string
  ticketTypeName: string
  buyerName: string
}

// Dessine la carte billet sur un canvas puis déclenche le téléchargement.
export async function downloadTicketImage(
  qrDataUrl: string,
  artwork: TicketImageArtwork,
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

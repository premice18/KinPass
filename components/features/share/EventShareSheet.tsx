'use client'

// ────────────────────────────────────────────────────────────────────────────
// Panneau de partage d'un événement (Phase 6.7).
//
// Modal accessible (rôle dialog, Échap, focus au retour) contenant :
//   - le partage NATIF du système (navigator.share) s'il est disponible ;
//   - l'URL canonique en lecture seule + copie en un clic (« Lien copié ! ») ;
//   - un QR code (partage physique / affiche) ;
//   - les canaux de diffusion : WhatsApp, Telegram, X (Twitter), Facebook.
// Réutilisé par la page publique /e/[slug] et la vue Détail du dashboard.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import QRCode from 'qrcode'
import { Check, Copy, ShareAndroid, Whatsapp, Xmark } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Eyebrow } from '@/components/ui/eyebrow'
import {
  buildEventUrl,
  buildFacebookShareUrl,
  buildShareText,
  buildTelegramShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
  type ShareableEvent,
} from '@/lib/share'

interface EventShareSheetProps {
  event: ShareableEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EventShareSheet({ event, open, onOpenChange }: EventShareSheetProps) {
  const url = buildEventUrl(event)
  const text = buildShareText(event)
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState('')

  // Génération du QR (client, `qrcode`) dès l'ouverture du panneau.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: 'M' })
      .then((dataUrl) => {
        if (!cancelled) setQr(dataUrl)
      })
      .catch(() => undefined)
    // Focus sur le bouton de fermeture (modal accessible).
    const timer = window.setTimeout(() => {
      document.getElementById('share-close')?.focus()
    }, 50)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, url])

  // Échap ferme le panneau.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  // Copie de l'URL (retour visuel « Lien copié ! »).
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Presse-papiers indisponible : silencieux (le champ reste sélectionnable).
    }
  }

  // Partage natif du système (mobile/desktop) — repli sur les canaux.
  const nativeAvailable = typeof navigator !== 'undefined' && 'share' in navigator
  const nativeShare = async () => {
    if (!nativeAvailable) return
    try {
      await navigator.share({ title: event.title, text, url })
      onOpenChange(false)
    } catch {
      // Annulé par l'utilisateur : on laisse le panneau ouvert.
    }
  }

  const fullShareText = `${text} — ${url}`

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          {/* Backdrop flouté */}
          <motion.button
            aria-label="Fermer le partage"
            tabIndex={-1}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-background/70 backdrop-blur-sm"
          />

          {/* Panneau */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Partager ${event.title}`}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            data-testid="share-sheet"
            className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-background p-6 shadow-xl shadow-black/10 sm:rounded-2xl"
          >
            {/* Fermeture */}
            <Button
              id="share-close"
              variant="ghost"
              size="icon-sm"
              aria-label="Fermer"
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3"
            >
              <Xmark className="h-4 w-4" />
            </Button>

            <Eyebrow>Partager l'événement</Eyebrow>
            <h2 className="mt-2 pr-8 text-xl font-bold tracking-tight">{event.title}</h2>

            {/* Partage natif (système) */}
            {nativeAvailable && (
              <Button className="mt-5 w-full" onClick={nativeShare} data-testid="share-native">
                <ShareAndroid className="h-4 w-4" />
                Partager…
              </Button>
            )}

            {/* URL + copie */}
            <div className="mt-4">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2 pl-3">
                <input
                  readOnly
                  value={url}
                  aria-label="Lien de l'événement"
                  data-testid="share-input"
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground focus:outline-none"
                />
                <Button variant="outline" size="sm" onClick={copyLink} data-testid="share-copy">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copié !' : 'Copier'}
                </Button>
              </div>
            </div>

            {/* Canaux de diffusion */}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <ChannelLink
                href={buildWhatsAppShareUrl(fullShareText)}
                testId="share-whatsapp"
                label="WhatsApp"
                icon={<Whatsapp className="h-4 w-4" />}
              />
              <ChannelLink
                href={buildTelegramShareUrl(text, url)}
                testId="share-telegram"
                label="Telegram"
                icon={<TelegramGlyph />}
              />
              <ChannelLink
                href={buildXShareUrl(text, url)}
                testId="share-x"
                label="X (Twitter)"
                icon={<XGlyph />}
              />
              <ChannelLink
                href={buildFacebookShareUrl(url)}
                testId="share-facebook"
                label="Facebook"
                icon={<FacebookGlyph />}
              />
            </div>

            {/* QR code (partage physique / affiche) */}
            <div className="mt-6 flex flex-col items-center gap-3 border-t border-dashed border-border pt-5">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr}
                  alt={`QR code — ${event.title}`}
                  data-testid="share-qr"
                  className="h-40 w-40 rounded-lg border border-border bg-white p-2"
                />
              ) : (
                <div className="h-40 w-40 animate-pulse rounded-lg border border-border bg-muted" aria-hidden="true" />
              )}
              <p className="text-center text-xs text-muted-foreground">
                Scannez ce QR pour ouvrir la page de l'événement (affiche, partage physique).
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

// Canal de diffusion (lien externe discret).
function ChannelLink({
  href,
  testId,
  label,
  icon,
}: {
  href: string
  testId: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-testid={testId}
      className="flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-cyan-500/50 hover:bg-muted/40"
    >
      {icon}
      {label}
    </a>
  )
}

// ── Plaquettes des canaux sans icône Iconoir (lettre stylisée, pas d'emoji) ─

function TelegramGlyph() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-white">
      T
    </span>
  )
}

function XGlyph() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[9px] font-bold text-white">
      X
    </span>
  )
}

function FacebookGlyph() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
      f
    </span>
  )
}

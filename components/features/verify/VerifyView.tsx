'use client'

// ────────────────────────────────────────────────────────────────────────────
// Vérification publique d'un billet — /verify (Phase 12).
//
// Saisie du code (majuscules auto, tirets ignorés) → 3 états réutilisant la
// sémantique du scanner (VERT valide / ORANGE déjà utilisé / ROUGE introuvable)
// avec icône + libellé (jamais la couleur seule).
// Si le billet est valide : téléchargements PDF / PNG / JPG + renvoi par email.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import QRCode from 'qrcode'
import {
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Mail,
  MapPin,
  Refresh,
  Search,
  WarningCircle,
  XmarkCircle,
} from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { cn } from '@/lib/utils'
import { downloadTicketImage } from '@/lib/ticket/image-export'
import { resendTicketByEmail, verifyTicket, type TicketVerification } from '@/lib/actions/verify'

function formatFullDate(value: Date | string | null | undefined): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export function VerifyView({ initialCode = '' }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode)
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<TicketVerification | null>(null)
  const [error, setError] = useState('')

  // Renvoi par email (formulaire sous le résultat).
  const [email, setEmail] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const [isPending, startTransition] = useTransition()

  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '')
  const displayCode = normalized.length > 3 ? `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}` : normalized

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (displayCode.length !== 7 || checking) return
    setChecking(true)
    setError('')
    setResult(null)
    setResendMessage('')
    setResendError('')
    const response = await verifyTicket(displayCode)
    setChecking(false)
    if (!response.success) {
      setError(response.error)
      return
    }
    setResult(response.data)
  }

  // Téléchargement image (PNG/JPG) — QR généré côté client puis canvas.
  const downloadImage = async (format: 'png' | 'jpeg') => {
    if (!result?.event) return
    const qr = await QRCode.toDataURL(displayCode, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
    await downloadTicketImage(
      qr,
      {
        code: displayCode,
        eventTitle: result.event.title,
        venue: [result.event.venue, result.event.location].filter(Boolean).join(' · '),
        ticketTypeName: result.ticketTypeName ?? 'Billet',
        buyerName: result.buyerName ?? '',
      },
      format,
    )
  }

  const handleResend = () => {
    setResendMessage('')
    setResendError('')
    startTransition(async () => {
      const response = await resendTicketByEmail({ code: displayCode, email })
      if (!response.success) {
        setResendError(response.error)
        return
      }
      setResendMessage(response.message)
    })
  }

  const status = result?.status

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <Eyebrow className="justify-center">Billet numérique</Eyebrow>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Vérifier mon billet</h1>
          <p className="mt-2 text-muted-foreground">
            Saisissez le code à 6 caractères de votre billet pour vérifier sa validité et le
            re-télécharger.
          </p>
        </div>

        {/* ── Saisie du code ──────────────────────────────────────────────── */}
        <Card className="mt-8">
          <CardContent className="p-5">
            <form onSubmit={handleVerify} className="flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Code du billet (6 caractères)</span>
                <Input
                  value={displayCode}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="A4B-8K9"
                  maxLength={7}
                  autoComplete="off"
                  className="h-12 font-mono text-xl font-semibold tracking-[0.25em]"
                  data-testid="verify-code-input"
                />
              </label>
              <Button
                type="submit"
                size="lg"
                className="sm:w-40"
                disabled={displayCode.length !== 7 || checking}
                data-testid="verify-submit"
              >
                {checking ? <Refresh className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" />Vérifier</>}
              </Button>
            </form>

            {error && (
              <p role="alert" className="mt-3 flex items-center gap-2 text-sm text-destructive">
                <WarningCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ── Résultat (3 états) ──────────────────────────────────────────── */}
        {result && (
          <Card
            data-testid="verify-result"
            className={cn(
              'mt-6',
              status === 'valid' && 'border-emerald-500/40',
              status === 'used' && 'border-amber-500/40',
              status === 'unknown' && 'border-destructive/40',
            )}
          >
            <CardContent className="p-6">
              {status === 'valid' ? (
                <div className="text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" data-testid="verify-valid-icon" />
                  <p className="mt-3 text-xl font-bold text-emerald-700 dark:text-emerald-300">Billet valide</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ce billet n’a pas encore été utilisé.</p>
                </div>
              ) : status === 'used' ? (
                <div className="text-center">
                  <Clock className="mx-auto h-12 w-12 text-amber-500" data-testid="verify-used-icon" />
                  <p className="mt-3 text-xl font-bold text-amber-700 dark:text-amber-300">Billet déjà utilisé</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Première entrée : <strong>{formatFullDate(result.firstScannedAt)}</strong>. Si ce n’est pas
                    vous, contactez l’organisateur.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <XmarkCircle className="mx-auto h-12 w-12 text-destructive" data-testid="verify-unknown-icon" />
                  <p className="mt-3 text-xl font-bold text-destructive">Billet introuvable</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aucun billet ne correspond à ce code. Vérifiez la saisie ou contactez l’organisateur.
                  </p>
                </div>
              )}

              {/* Détails (si le billet existe) */}
              {result.event && (
                <div className="mt-5 space-y-2 rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">{result.event.title}</p>
                  {result.event.startAt && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatFullDate(result.event.startAt)}
                    </p>
                  )}
                  {(result.event.venue || result.event.location) && (
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {[result.event.venue, result.event.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    {result.ticketTypeName} — <span className="font-mono font-semibold text-foreground">{displayCode}</span>
                    {result.buyerName ? ` — ${result.buyerName}` : ''}
                  </p>
                </div>
              )}

              {/* Actions (billet valide ou utilisé : le billet existe) */}
              {result.event && (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/tickets/${encodeURIComponent(displayCode)}/pdf`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                      data-testid="verify-download-pdf"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </a>
                    <Button variant="outline" onClick={() => downloadImage('png')} data-testid="verify-download-png">
                      <Download className="h-4 w-4" />
                      PNG
                    </Button>
                    <Button variant="outline" onClick={() => downloadImage('jpeg')} data-testid="verify-download-jpg">
                      <Download className="h-4 w-4" />
                      JPG
                    </Button>
                  </div>

                  {/* Renvoi par email (réponse générique) */}
                  <div className="border-t border-dashed border-border pt-4">
                    <label className="block space-y-2 text-sm font-medium">
                      Recevoir ce billet par email
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <span className="relative flex-1">
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@exemple.cd"
                            className="pl-9"
                            data-testid="verify-resend-email"
                          />
                          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </span>
                        <Button
                          variant="outline"
                          onClick={handleResend}
                          disabled={isPending || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                          data-testid="verify-resend-submit"
                        >
                          {isPending ? <Refresh className="h-4 w-4 animate-spin" /> : 'Envoyer'}
                        </Button>
                      </div>
                    </label>
                    {resendMessage && (
                      <p role="status" data-testid="verify-resend-message" className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                        {resendMessage}
                      </p>
                    )}
                    {resendError && (
                      <p role="alert" className="mt-2 text-sm text-destructive">
                        {resendError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}

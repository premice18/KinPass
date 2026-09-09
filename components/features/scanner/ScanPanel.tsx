'use client'

// ────────────────────────────────────────────────────────────────────────────
// Interface de scan d'un événement — `/scan/[slug]` (Phase 7.3).
//
// Deux voies : saisie manuelle du code 6 caractères (majuscules auto, tirets
// ignorés) et caméra QR (html5-qrcode). Retours VERT / ORANGE / ROUGE
// (jamais la couleur seule : icône + libellé) + petit retour sonore.
// Chaque passage est journalisé (`scans.agent_id` = agent connecté) et
// l'historique « qui j'ai scanné » est affiché sous le panneau.
// ────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'
import {
  Camera,
  CheckCircle,
  Clock,
  Refresh,
  WarningCircle,
  Xmark,
  XmarkCircle,
} from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  getAgentEventScans,
  scanTicket,
  type AgentAssignedEvent,
  type AgentScanEntry,
  type ScanOutcome,
} from '@/lib/actions/team'

interface ScanPanelProps {
  event: AgentAssignedEvent
}

// Petits sons de retour (Web Audio — pas de fichier, pas d'emoji).
function playTone(frequency: number, durationMs: number) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const context = new Ctx()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.08, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + durationMs / 1000)
    oscillator.start()
    oscillator.stop(context.currentTime + durationMs / 1000)
    oscillator.onended = () => context.close()
  } catch {
    // Audio indisponible : silencieux (le retour visuel reste).
  }
}

function beepValid() {
  playTone(880, 180)
}
function beepInvalid() {
  playTone(220, 260)
}
function beepUsed() {
  playTone(520, 200)
}

// Vibration mobile courte (si le navigateur le permet — retour tactile).
function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  } catch {
    // Vibrations indisponibles : silencieux.
  }
}

const STATUS_META: Record<ScanOutcome['result'], { label: string; hint: string }> = {
  valid: { label: 'Billet valide', hint: 'Entrée autorisée' },
  used: { label: 'Billet déjà scanné', hint: 'Premier passage déjà enregistré' },
  invalid: { label: 'Billet introuvable ou étranger', hint: 'Code inconnu de cet événement' },
}

export function ScanPanel({ event }: ScanPanelProps) {
  // Saisie manuelle.
  const [code, setCode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanOutcome | null>(null)
  const [error, setError] = useState('')

  // Caméra.
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const cameraStartedRef = useRef(false)

  // Historique de l'agent sur cet événement.
  const [history, setHistory] = useState<AgentScanEntry[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  // N'ouvre l'historique automatiquement qu'au PREMIER scan (pas de saut de
  // mise en page à chaque passage ensuite — l'utilisateur garde la main).
  const [historyAutoOpened, setHistoryAutoOpened] = useState(false)

  const normalize = (value: string): string => value.toUpperCase().replace(/[^A-Z0-9]/g, '')

  // Ferme le pop-up de résultat et réarme le champ pour le scan suivant.
  const closeResult = useCallback(() => {
    setResult(null)
    setCode('')
    setError('')
    // Léger délai pour éviter un double scan accidentel.
    window.setTimeout(() => {
      document.getElementById('scan-code-input')?.focus()
    }, 120)
  }, [])

  // Le pop-up se ferme tout seul après ~3,5 s (ou au clic, ou avec Échap) —
  // assez long pour lire le nom à la porte, assez court pour la cadence.
  useEffect(() => {
    if (!result) return
    const timer = window.setTimeout(closeResult, 3500)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeResult()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [result, closeResult])

  const performScan = useCallback(
    async (rawCode: string) => {
      const normalized = normalize(rawCode)
      if (normalized.length < 6 || scanning || result) return
      setScanning(true)
      setError('')
      const response = await scanTicket(event.id, normalized)
      setScanning(false)
      if (!response.success) {
        setError(response.error)
        setCode('')
        return
      }
      const outcome = response.data
      setResult(outcome)
      // Retours distincts : son + vibration selon l'état.
      if (outcome.result === 'valid') {
        beepValid()
        vibrate([60, 40, 120])
      } else if (outcome.result === 'used') {
        beepUsed()
        vibrate(120)
      } else {
        beepInvalid()
        vibrate([200, 60, 200])
      }
      // Historique : chargé à chaque scan, mais auto-ouvert UNE fois seulement.
      loadHistory()
      if (!historyAutoOpened) {
        setHistoryAutoOpened(true)
        setHistoryOpen(true)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event.id, scanning, result, historyAutoOpened],
  )

  const loadHistory = useCallback(async () => {
    const response = await getAgentEventScans(event.id)
    if (response.success) setHistory(response.data)
  }, [event.id])

  useEffect(() => {
    loadHistory()
    return () => {
      // Arrêt propre de la caméra au démontage.
      if (cameraStartedRef.current && scannerRef.current) {
        scannerRef.current.stop().catch(() => undefined)
      }
    }
  }, [loadHistory])

  // Démarre/arrête la caméra (html5-qrcode — nécessite HTTPS ou localhost).
  // NB : le conteneur #scan-camera-region est TOUJOURS dans le DOM (classe
  // hidden sinon) : html5-qrcode exige que l'élément existe au `start()`.
  const toggleCamera = async () => {
    if (cameraOn) {
      if (scannerRef.current) await scannerRef.current.stop().catch(() => undefined)
      cameraStartedRef.current = false
      setCameraOn(false)
      return
    }
    if (cameraStarting) return
    setError('')
    setCameraStarting(true)
    const scanner = new Html5Qrcode('scan-camera-region')
    scannerRef.current = scanner
    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          // Décodage réussi → scan immédiat puis pause de la caméra.
          void scanner.stop().catch(() => undefined)
          cameraStartedRef.current = false
          setCameraOn(false)
          void performScan(decodedText)
        },
        () => {
          // Tram images ignorées (aucun QR détecté).
        },
      )
      cameraStartedRef.current = true
      setCameraOn(true)
    } catch (err) {
      setCameraOn(false)
      const message =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Autorisation caméra refusée : autorisez l’accès à la caméra dans votre navigateur, puis réessayez.'
          : err instanceof Error && err.name === 'NotFoundError'
            ? 'Aucune caméra détectée sur cet appareil.'
            : 'Caméra indisponible (environnement non sécurisé ou autorisation refusée). Utilisez la saisie manuelle.'
      setError(message)
    } finally {
      setCameraStarting(false)
    }
  }

  const inputValue = normalize(code)
  const displayCode = inputValue.length > 3 ? `${inputValue.slice(0, 3)}-${inputValue.slice(3, 6)}` : inputValue

  return (
    <div className="space-y-5">
      {/* ── Pop-up de résultat (3 états) — s'ouvre à chaque scan, se ferme
           seul après ~3,5 s, au clic sur « Continuer » ou avec Échap.
           MotionConfig reducedMotion="user" : aucune animation si demandé. */}
      <MotionConfig reducedMotion="user">
        <AnimatePresence>
          {result && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={STATUS_META[result.result].label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
            data-testid="scan-result-popup"
          >
            {/* Backdrop cliquable pour fermer */}
            <button
              type="button"
              aria-label="Fermer"
              tabIndex={-1}
              onClick={closeResult}
              className="absolute inset-0 h-full w-full cursor-default"
            />

            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'relative w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-xl shadow-black/10',
                result.result === 'valid' && 'border-emerald-500/50',
                result.result === 'used' && 'border-amber-500/50',
                result.result === 'invalid' && 'border-destructive/50',
              )}
            >
              {result.result === 'valid' ? (
                <>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                    <CheckCircle className="h-10 w-10 text-emerald-500" data-testid="scan-valid-icon" />
                  </span>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-300">
                    Billet valide
                  </h2>
                  <p className="mt-2 text-lg font-semibold">{result.buyerName}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Billet {result.ticketTypeName}</p>
                  <p className="mt-4 inline-flex rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Entrée autorisée
                  </p>
                </>
              ) : result.result === 'used' ? (
                <>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
                    <Clock className="h-10 w-10 text-amber-500" data-testid="scan-used-icon" />
                  </span>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-300">
                    Billet déjà scanné
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Premier passage :{' '}
                    <span className="font-mono font-semibold text-foreground">
                      {new Date(result.firstScannedAt).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                  <p className="mt-4 inline-flex rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Déjà entré
                  </p>
                </>
              ) : (
                <>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
                    <XmarkCircle className="h-10 w-10 text-destructive" data-testid="scan-invalid-icon" />
                  </span>
                  <h2 className="mt-4 text-2xl font-bold tracking-tight text-destructive">
                    Billet introuvable ou étranger
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ce code ne correspond à aucun billet de cet événement.
                  </p>
                  <p className="mt-4 inline-flex rounded-full bg-destructive/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-destructive">
                    Accès refusé
                  </p>
                </>
              )}

              <Button className="mt-6 w-full" onClick={closeResult} data-testid="scan-result-close" autoFocus>
                Continuer
              </Button>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
      </MotionConfig>

      {/* ── Saisie manuelle + caméra ─────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-4 p-5">
          {error && (
            <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
              <WarningCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (displayCode.length === 7) void performScan(displayCode)
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <label className="relative flex-1">
              <span className="sr-only">Code du billet (6 caractères)</span>
              <Input
                id="scan-code-input"
                value={displayCode}
                onChange={(e) => setCode(normalize(e.target.value))}
                placeholder="A4B-8K9"
                maxLength={7}
                autoComplete="off"
                autoFocus
                disabled={scanning || result !== null}
                className="h-12 pl-4 font-mono text-xl font-semibold tracking-[0.25em]"
                data-testid="scan-code-input"
                inputMode="text"
              />
            </label>
            <Button
              type="submit"
              size="lg"
              className="sm:w-44"
              disabled={displayCode.length !== 7 || scanning || result !== null}
              data-testid="scan-submit"
            >
              {scanning ? (
                <Refresh className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Valider
                </>
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3 border-t border-dashed border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              {result ? STATUS_META[result.result].label : "En attente d'un billet…"} · {event.title}
            </p>
            {/* Cible tactile confortable (kiosque de porte) */}
            <Button
              type="button"
              variant="outline"
              onClick={toggleCamera}
              disabled={cameraStarting}
              data-testid="scan-camera-toggle"
              className="w-full sm:w-auto"
            >
              <Camera className="h-4 w-4" />
              {cameraStarting
                ? 'Démarrage de la caméra…'
                : cameraOn
                  ? 'Arrêter la caméra'
                  : 'Scanner par caméra'}
            </Button>
          </div>

          {/* Zone caméra (html5-qrcode) — conteneur TOUJOURS monté (requis par
              la lib au start()), simplement masqué quand la caméra est coupée. */}
          <div
            id="scan-camera-region"
            className={cn(
              'overflow-hidden rounded-lg border border-border bg-slate-950',
              cameraOn ? 'block' : 'hidden',
            )}
            data-testid="scan-camera"
          />
        </CardContent>
      </Card>

      {/* ── Historique « qui j'ai scanné » ───────────────────────────────── */}
      <div>
        <button
          type="button"
          onClick={() => setHistoryOpen((value) => !value)}
          className="text-sm font-medium text-cyan-600 underline-offset-4 hover:underline dark:text-cyan-400"
          data-testid="scan-history-toggle"
        >
          {historyOpen ? 'Masquer' : 'Voir'} mes scans récents ({history.length})
        </button>
        {historyOpen && (
          <Card className="mt-3 overflow-hidden" data-testid="scan-history">
            {history.length === 0 ? (
              <CardContent className="p-5 text-sm text-muted-foreground">
                Aucun scan enregistré pour le moment.
              </CardContent>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Code</th>
                      <th className="px-4 py-2.5 font-medium">Acheteur</th>
                      <th className="px-4 py-2.5 font-medium">Résultat</th>
                      <th className="px-4 py-2.5 font-medium">Heure</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.map((entry, index) => (
                      <tr key={`${entry.code}-${index}`}>
                        <td className="px-4 py-2 font-mono text-xs tracking-wider">{entry.code}</td>
                        <td className="px-4 py-2">{entry.buyerName}</td>
                        <td className="px-4 py-2">
                          <span
                            className={cn(
                              'rounded-[3px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
                              entry.result === 'valid'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {entry.result === 'valid' ? 'Entrée' : 'Doublon'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {new Date(entry.scannedAt).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

'use client'

// ────────────────────────────────────────────────────────────────────────────
// Coquille visuelle commune aux pages d'authentification — écran scindé.
//
// Desktop (lg+) : l'écran est coupé en deux —
//   · GAUCHE : le formulaire (premier élément lu, action immédiate) ;
//   · DROITE : panneau de marque sombre avec une photo Pexels (remplaçable)
//     et les promesses produit — l'image est décorative, la lisibilité est
//     garantie par un voile sombre.
// Mobile : seul le formulaire s'affiche (l'image est masquée : page légère,
// focus sur la tâche). Ordre DOM = ordre visuel (form d'abord partout).
// ────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'
import { ArrowLeft, Check, QrCode, Refresh, SmartphoneDevice, WarningCircle } from 'iconoir-react'
import { motion } from 'framer-motion'

import { Logo } from '@/components/layout/Logo'
import { Card, CardContent } from '@/components/ui/card'
import { usePexelsImages } from '@/lib/hooks/use-pexels-images'

interface AuthShellProps {
  children: ReactNode
  error?: string
  pending?: boolean
}

// Promesses produit affichées sur le panneau de marque.
const PROMISES = [
  { icon: QrCode, text: 'Billets numériques scannés à la porte' },
  { icon: SmartphoneDevice, text: 'Paiement Mobile Money (M-Pesa, Orange, Airtel)' },
  { icon: Check, text: 'Vos revenus reversés simplement' },
]

export function AuthShell({ children, error, pending }: AuthShellProps) {
  // Photo du panneau de marque — photo libre (Pexels via proxy serveur),
  // à remplacer par une image de marque définitive plus tard.
  const { images } = usePexelsImages('concert crowd lights', 4)
  const brandImage = images[0]

  return (
    <main className="min-h-dvh bg-background lg:grid lg:grid-cols-2">
      {/* ── Colonne formulaire (mobile = seule colonne) ─────────────────── */}
      <section className="flex min-h-dvh flex-col px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
        {/* Logo → accueil */}
        <a
          href="/"
          className="flex w-fit items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <Logo className="h-8 w-8 shrink-0" />
          kinPass
        </a>

        {/* Formulaire centré dans l'espace restant */}
        <div className="flex flex-1 items-center justify-center py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-sm"
          >
            <Card>
              <CardContent className="p-6 sm:p-7">
                {children}

                {/* Bannière d'erreur commune */}
                {error && (
                  <div
                    role="alert"
                    className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  >
                    <WarningCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Indicateur de soumission (transition React) */}
                {pending && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Refresh className="h-4 w-4 animate-spin" />
                    Veuillez patienter…
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Retour à l'accueil (bas de la colonne) */}
        <div className="pb-1 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’accueil
          </a>
        </div>
      </section>

      {/* ── Panneau de marque (desktop uniquement) ──────────────────────── */}
      <aside className="relative hidden overflow-hidden bg-slate-950 lg:block" aria-hidden="true">
        {/* Photo d'ambiance (décorative) */}
        {brandImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandImage.src}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(148,163,184,0.25)_1px,transparent_1px)] [background-size:26px_26px]" />
        )}

        {/* Voile de lisibilité (dégradé sombre) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

        {/* Contenu du panneau */}
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Billetterie sécurisée en RDC
          </p>
          <h2 className="mt-4 max-w-md text-balance text-3xl font-bold leading-tight tracking-tight text-white">
            Vos événements, du billet à la porte.
          </h2>
          <ul className="mt-8 space-y-3">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-slate-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-400">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>

          {/* Perforation de talon (clôture visuelle) */}
          <div className="mt-10 border-t border-dashed border-white/15 pt-5 text-sm text-slate-400">
            © 2026 kinPass — la billetterie pensée pour la RDC.
          </div>
        </div>
      </aside>
    </main>
  )
}

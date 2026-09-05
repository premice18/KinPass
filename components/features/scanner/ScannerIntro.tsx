'use client'

// ────────────────────────────────────────────────────────────────────────────
// « Contrôle d'accès » — page d'explication (visiteurs / organisateurs).
//
// Le scan de billets est réservé aux AGENTS DE CONTRÔLE : des comptes dédiés
// créés par l'organisateur (Phase 7). Cette page explique le rôle et aiguille
// : un organisateur crée son compte (~30 s), un agent reçoit ses identifiants
// de son organisateur — jamais d'auto-inscription.
// ────────────────────────────────────────────────────────────────────────────

import { QrCode, UserPlus, ArrowRight, Check } from 'iconoir-react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'

export function ScannerIntro() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8 sm:py-20">
          <Eyebrow className="justify-center text-cyan-400">Contrôle d'accès</Eyebrow>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            L'entrée de votre événement, sécurisée.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-8 text-slate-300">
            Vos équipes à la porte scannent chaque billet (QR ou code 6 caractères) et l'accès est
            validé en quelques secondes. Le scan est réservé aux{' '}
            <strong className="text-white">agents de contrôle</strong> : des comptes dédiés, créés
            par l'organisateur de l'événement.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth/register"
              className={buttonVariants({ variant: 'default', size: 'lg' })}
              data-testid="scanner-intro-register"
            >
              Créer mon compte organisateur
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/auth/login"
              className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'text-slate-200 hover:bg-white/10 hover:text-white' })}
            >
              J'ai déjà un compte — Se connecter
            </a>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Check className="h-4 w-4 text-cyan-400" />
            L'outil de scan sera activé pour vos équipes très bientôt (Phase 7)
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: 'Scan QR ou code',
              text: 'Caméra ou saisie du code à 6 caractères — avec retour visuel et sonore à la porte.',
            },
            {
              icon: UserPlus,
              title: 'Comptes créés par vous',
              text: 'Vous créez un compte par agent et l’assignez à vos événements. Aucun auto-inscription.',
            },
            {
              icon: Check,
              title: 'Aucun accès aux ventes',
              text: 'Un agent ne voit que le scan : jamais vos revenus, contrats ou réglages.',
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

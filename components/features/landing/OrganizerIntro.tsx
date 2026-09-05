'use client'

// ────────────────────────────────────────────────────────────────────────────
// « Pour les organisateurs » — page de valeur avant inscription.
//
// Atterrissage du CTA « Créer un événement » pour un visiteur NON connecté :
// au lieu du dashboard (qui exigerait une session et afficherait une erreur),
// on présente le bénéfice + la simplicité de l'inscription (30 secondes),
// puis on aiguille vers /auth/register ou /auth/login.
// ────────────────────────────────────────────────────────────────────────────

import { Check, QrCode, SmartphoneDevice, ArrowRight } from 'iconoir-react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BENEFITS = [
  {
    icon: QrCode,
    title: 'Une page publique par événement',
    text: 'Votre événement a son URL de vente, sa galerie et son partage WhatsApp — prête en quelques minutes.',
  },
  {
    icon: SmartphoneDevice,
    title: 'Paiement Mobile Money',
    text: 'M-Pesa, Orange Money et Airtel Money : vos invités paient depuis leur téléphone, sans cash à gérer.',
  },
  {
    icon: Check,
    title: 'Billets numériques scannés à la porte',
    text: 'QR code + code de secours à 6 caractères. Vos équipes contrôlent l’entrée en quelques secondes.',
  },
]

const STEPS = [
  { n: '01', title: 'Créez votre compte', text: 'Gratuit, en une trentaine de secondes — nom, email, mot de passe.' },
  { n: '02', title: 'Configurez votre événement', text: 'Billets, prix, capacité, affiche… puis publiez-le en un clic.' },
  { n: '03', title: 'Vendez et contrôlez', text: 'Suivez vos ventes en temps réel et scannez les billets à l’entrée.' },
]

export function OrganizerIntro() {
  return (
    <main className="min-h-screen bg-background">
      {/* ── Héro compact ─────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-slate-950 text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-8 sm:py-20">
          <Eyebrow className="justify-center text-cyan-400">Espace organisateur</Eyebrow>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Vendez et contrôlez vos billets, simplement.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-8 text-slate-300">
            kinPass s’occupe de votre billetterie de bout en bout : page publique, paiement Mobile
            Money et scan à la porte — sans installation, sans paperasse.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/auth/register"
              className={buttonVariants({ variant: 'default', size: 'lg' })}
              data-testid="organizer-intro-register"
            >
              Créer mon compte organisateur
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/auth/login"
              className={buttonVariants({ variant: 'ghost', size: 'lg', className: 'text-slate-200 hover:bg-white/10 hover:text-white' })}
            >
              J’ai déjà un compte — Se connecter
            </a>
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-400">
            <Check className="h-4 w-4 text-cyan-400" />
            Inscription gratuite — environ 30 secondes, aucune carte requise
          </p>
        </div>
      </section>

      {/* ── Bénéfices ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-3 md:gap-0">
          {BENEFITS.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className={cn('md:border-l md:border-dashed md:border-border md:px-8', index === 0 && 'md:border-l-0 md:pl-0')}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-tight">{title}</h2>
              <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Étapes 01 → 02 → 03 ──────────────────────────────────────────── */}
      <section className="border-t border-dashed border-border bg-card/40">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
          <ol className="space-y-0">
            {STEPS.map((step, index) => (
              <li
                key={step.n}
                className={cn(
                  'flex flex-col gap-3 border-b border-dashed border-border py-6 sm:flex-row sm:items-start sm:gap-8',
                  index === STEPS.length - 1 && 'border-b-0 pb-0',
                )}
              >
                <span className="font-mono text-sm font-semibold text-cyan-600 dark:text-cyan-400">{step.n}</span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 text-center">
            <a
              href="/auth/register"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              Commencer maintenant
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

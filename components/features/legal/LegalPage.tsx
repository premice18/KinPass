// ────────────────────────────────────────────────────────────────────────────
// Coquille commune des pages légales (Phase 11.1, revue UI/UX).
//
// - MENU de navigation entre documents : latéral sticky sur desktop (état
//   actif visible — règle skill « Active State »), chips horizontales
//   scrollables sur mobile ; jamais de recouvrement du contenu.
// - RETOUR CONTEXTUEL : quand la page est ouverte depuis l'inscription
//   (`?from=register`), une bannière « Revenir à l'inscription » s'affiche.
// - CTA FINAL (règle landing « Final CTA ») : bloc de conversion en bas de
//   document → création de compte organisateur / connexion (masquable).
// ────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight } from 'iconoir-react'

import { Logo } from '@/components/layout/Logo'
import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Version des documents (à incrémenter à chaque évolution — la re-signature
// est gérée par `contract_acceptances`, Phase 11.2).
export const LEGAL_VERSION = '1.0'

export type LegalSlug = 'cgu' | 'privacy' | 'contract' | 'about' | 'contact'

const LEGAL_NAV: Array<{ slug: LegalSlug; href: string; label: string; short: string; hidden?: boolean }> = [
  { slug: 'cgu', href: '/legal/cgu', label: 'Conditions d’utilisation', short: 'Conditions' },
  { slug: 'privacy', href: '/legal/privacy', label: 'Politique de confidentialité', short: 'Confidentialité' },
  // Non exposé aux visiteurs (décision « consentement au bon moment ») : la
  // page reste PUBLIQUE (nécessaire à l'acceptation) mais les liens vers elle
  // vivent côté organisateur (inscription, dashboard, retrait) + CGU.
  { slug: 'contract', href: '/legal/contract', label: 'Reversements & commission', short: 'Reversements', hidden: true },
  { slug: 'about', href: '/legal/about', label: 'À propos de kinPass', short: 'À propos' },
  { slug: 'contact', href: '/legal/contact', label: 'Contacter l’équipe', short: 'Contact' },
]

// Entrées affichées dans les menus (le contrat est masqué aux visiteurs).
const MENU_NAV = LEGAL_NAV.filter((item) => !item.hidden)

interface LegalPageProps {
  // Document courant (état actif du menu).
  current: LegalSlug
  eyebrow: string
  title: string
  updatedAt?: string
  // Bloc CTA final (masqué sur la page Contact par exemple).
  showAuthCta?: boolean
  // Retour contextuel (ex. ouvert depuis l'inscription).
  backHref?: string
  backLabel?: string
  children: ReactNode
}

export function LegalPage({
  current,
  eyebrow,
  title,
  updatedAt = '1er septembre 2026',
  showAuthCta = true,
  backHref,
  backLabel,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* En-tête sticky (occupe sa place dans le flux : aucun recouvrement) */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="h-8 w-8 shrink-0" />
            kinPass
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-muted-foreground sm:inline">Version {LEGAL_VERSION}</span>
            <a
              href="/auth/register"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              data-testid="legal-header-register"
            >
              Créer un compte
            </a>
          </div>
        </div>
      </header>

      {/* Navigation mobile : chips scrollables (état actif visible) */}
      <nav
        aria-label="Documents légaux"
        className="border-b border-border lg:hidden"
      >
        <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {MENU_NAV.map((item) => (
            <a
              key={item.slug}
              href={item.href}
              aria-current={item.slug === current ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                item.slug === current
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {item.short}
            </a>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid lg:grid-cols-[220px_1fr]">
        {/* Menu latéral desktop (sticky sous l'en-tête) */}
        <aside className="hidden lg:block">
          <nav aria-label="Documents légaux" className="sticky top-20">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documents
            </p>
            <ul className="mt-3 space-y-1">
              {MENU_NAV.map((item) => (
                <li key={item.slug}>
                  <a
                    href={item.href}
                    aria-current={item.slug === current ? 'page' : undefined}
                    className={cn(
                      'block border-l-2 py-1.5 pl-3 text-sm transition-colors',
                      item.slug === current
                        ? 'border-cyan-500 font-medium text-foreground'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground',
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0">
          {/* Retour contextuel (ex. document ouvert depuis l'inscription) */}
          {backHref && (
            <a
              href={backHref}
              data-testid="legal-back-link"
              className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/5 px-3 py-2 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-500/10 dark:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel ?? 'Revenir à l’inscription'}
            </a>
          )}

          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Dernière mise à jour : {updatedAt}</p>

          {/* Corps du document */}
          <div className="mt-8 space-y-6 text-[15px] leading-7 text-foreground/90 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_p]:text-foreground/90 [&_strong]:text-foreground [&_ul]:space-y-1.5">
            {children}
          </div>

          {/* CTA final (règle landing « Final CTA ») */}
          {showAuthCta && (
            <section
              data-testid="legal-cta"
              className="mt-12 rounded-xl border border-border bg-slate-950 p-6 text-white sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Passer à l’action
              </p>
              <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                Créez votre événement en quelques minutes.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                Inscription gratuite (~30 secondes) : page publique, paiement Mobile Money et contrôle
                des entrées — sans installation.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="/auth/register"
                  className={buttonVariants({ variant: 'default' })}
                  data-testid="legal-cta-register"
                >
                  Créer mon compte organisateur
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/auth/login"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
                >
                  J’ai déjà un compte — Se connecter
                </a>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="border-t border-dashed border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© 2026 kinPass — billetterie et contrôle d’accès en RDC.</span>
          <a href="/" className="hover:text-foreground">
            Retour à l’accueil
          </a>
        </div>
      </footer>
    </div>
  )
}


'use client'

// ────────────────────────────────────────────────────────────────────────────
// Coquille visuelle commune aux pages d'authentification.
//
// Centré, sobre, avec le logo et un lien de retour à l'accueil. Le message
// d'erreur (bannière) et le bouton avec état de chargement sont partagés
// entre connexion et inscription.
// ────────────────────────────────────────────────────────────────────────────

import type { ReactNode } from 'react'
import { ArrowLeft, Refresh, WarningCircle } from 'iconoir-react'
import { motion } from 'framer-motion'

import { Logo } from '@/components/layout/Logo'
import { Card, CardContent } from '@/components/ui/card'

interface AuthShellProps {
  children: ReactNode
  error?: string
  pending?: boolean
}

export function AuthShell({ children, error, pending }: AuthShellProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Retour à l'accueil */}
      <a
        href="/"
        className="mb-8 flex items-center gap-2 font-semibold tracking-tight text-foreground"
      >
        <Logo className="h-9 w-9 shrink-0" />
        kinPass
      </a>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Card>
          <CardContent className="p-6">
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

        <div className="mt-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l’accueil
          </a>
        </div>
      </motion.div>
    </main>
  )
}

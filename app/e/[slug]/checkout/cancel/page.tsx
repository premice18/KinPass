// ────────────────────────────────────────────────────────────────────────────
// Page d'annulation — `/e/[slug]/checkout/cancel` (Phase 6.5).
//
// Message clair d'échec/annulation + bouton « Réessayer » (retour au tunnel)
// et retour à l'événement. Page statique publique, aucune donnée en base.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { buttonVariants } from '@/components/ui/button'
import { WarningCircle } from 'iconoir-react'

interface CancelPageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Paiement annulé — kinPass',
  robots: 'noindex, nofollow',
}

export default async function CancelPage({ params }: CancelPageProps) {
  const { slug } = await params

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <WarningCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">Paiement annulé</h1>
        <p className="mt-3 text-muted-foreground">
          La transaction n'a pas abouti : elle a été annulée ou a échoué. Aucun montant n'a été débité.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <a
            href={`/e/${slug}/checkout`}
            className={buttonVariants({ variant: 'default', size: 'lg', className: 'w-full' })}
          >
            Réessayer
          </a>
          <a
            href={`/e/${slug}`}
            className={buttonVariants({ variant: 'ghost', className: 'w-full' })}
          >
            Retour à l'événement
          </a>
        </div>
      </div>
    </main>
  )
}

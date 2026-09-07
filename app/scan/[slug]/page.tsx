// ────────────────────────────────────────────────────────────────────────────
// Scan d'un événement — `/scan/[slug]` (Phase 7.2, placeholder).
//
// L'interface complète (caméra QR + saisie manuelle + états VERT/ORANGE/
// ROUGE + écriture des scans) arrive avec la Phase 7.3. Cette page vérifie
// que l'agent connecté est bien assigné à l'événement, puis annonce la suite.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowLeft, QrCode } from 'iconoir-react'

import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'

interface ScanEventPageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Scan — kinPass',
  robots: 'noindex, nofollow',
}

export default async function ScanEventPage({ params }: ScanEventPageProps) {
  const { slug } = await params
  // Double protection (le middleware le fait déjà) : agent uniquement.
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') redirect('/scan')

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center">
        <QrCode className="mx-auto h-12 w-12 text-cyan-500" />
        <Eyebrow className="justify-center">Contrôle d'accès</Eyebrow>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{slug.replace(/-/g, ' ')}</h1>
        <p className="mt-3 text-muted-foreground">
          L'interface de scan de cet événement arrive très bientôt (Phase 7.3) : caméra QR, saisie du
          code 6 caractères et validation en quelques secondes.
        </p>
        <a href="/scan" className={buttonVariants({ variant: 'ghost', className: 'mt-6' })}>
          <ArrowLeft className="h-4 w-4" />
          Retour à mes événements
        </a>
      </div>
    </main>
  )
}

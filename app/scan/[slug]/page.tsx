// ────────────────────────────────────────────────────────────────────────────
// Scan d'un événement — `/scan/[slug]` (Phase 7.3, agent uniquement).
//
// Vérifie (côté serveur ET middleware) que l'agent connecté est bien assigné
// à cet événement, puis rend le panneau de scan : saisie manuelle du code
// 6 caractères + caméra QR, retours VERT/ORANGE/ROUGE, journal des passages.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin } from 'iconoir-react'

import { ScanPanel } from '@/components/features/scanner/ScanPanel'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Eyebrow } from '@/components/ui/eyebrow'
import { buttonVariants } from '@/components/ui/button'
import { getCurrentUser } from '@/lib/auth'
import { getAgentAssignedEventBySlug } from '@/lib/actions/team'

interface ScanEventPageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: 'Scan — kinPass',
  robots: 'noindex, nofollow',
}

function formatFullDate(value: Date | null): string {
  if (!value) return ''
  const date = new Date(value)
  const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${day} à ${time}`
}

export default async function ScanEventPage({ params }: ScanEventPageProps) {
  const { slug } = await params
  // Double protection : agent uniquement.
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') redirect('/scan')

  // L'agent doit être assigné à CET événement.
  const result = await getAgentAssignedEventBySlug(slug)
  if (!result.success) redirect('/scan')
  const event = result.data

  return (
    <div className="min-h-screen bg-background">
      {/* En-tête discret (l'espace agent a son propre cadre). */}
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <a href="/scan" className={buttonVariants({ variant: 'ghost', size: 'sm', className: '-ml-2' })}>
            <ArrowLeft className="h-4 w-4" />
            Mes événements
          </a>
          <span className="min-w-0 truncate text-sm font-semibold tracking-tight">{event.title}</span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Eyebrow>Contrôle d'accès</Eyebrow>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl" data-testid="scan-event-title">
          {event.title}
        </h1>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          {event.startAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatFullDate(event.startAt)}
            </span>
          )}
          {(event.venue || event.location) && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[event.venue, event.location].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>

        <div className="mt-6">
          <ScanPanel event={event} />
        </div>
      </main>
    </div>
  )
}

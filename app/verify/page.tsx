import type { Metadata } from 'next'
import { Logo } from '@/components/layout/Logo'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { VerifyView } from '@/components/features/verify/VerifyView'

export const metadata: Metadata = {
  title: 'Vérifier mon billet — kinPass',
  description:
    'Vérifiez la validité d’un billet kinPass (code à 6 caractères) et re-téléchargez-le en PDF, PNG ou JPG.',
  robots: 'noindex, nofollow',
}

// Page publique de vérification (Phase 12) — aucune session requise.
// `?code=` permet de préremplir depuis la page événement.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>
}) {
  const { code } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Logo className="h-8 w-8 shrink-0" />
            kinPass
          </a>
          <ThemeToggle />
        </div>
      </header>
      <VerifyView initialCode={code ?? ''} />
    </div>
  )
}

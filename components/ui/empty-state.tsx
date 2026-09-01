import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

// ────────────────────────────────────────────────────────────────────────────
// EmptyState — état vide réutilisable.
//
// Affiche une illustration SVG (dossier `public/illustrations/`), un titre,
// une description optionnelle et des actions. Utilisé pour les listes vides
// (événements, billets, historique) et les états « rien à afficher ».
// ────────────────────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string
  description?: string
  // Chemin de l'illustration dans /public/illustrations/.
  illustration?: string
  className?: string
  children?: ReactNode
}

export function EmptyState({
  title,
  description,
  illustration = '/illustrations/empty-events.svg',
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center',
        className,
      )}
    >
      {/* Illustration décorative : cachée aux lecteurs d'écran */}
      <img
        src={illustration}
        alt=""
        width={160}
        height={160}
        loading="lazy"
        className="h-32 w-32 select-none opacity-90"
      />
      <p className="font-semibold">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

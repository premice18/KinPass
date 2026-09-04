import { Logo } from '@/components/layout/Logo'
import { buttonVariants } from '@/components/ui/button'

// Page 404 globale (français) — retrouvée pour tout chemin inexistant,
// y compris un événement public inconnu ou non publié (/e/[slug], Phase 6.1).
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo className="h-10 w-10" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl">Page introuvable</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Cette page n'existe pas ou n'est plus disponible. Retournez à l'accueil pour découvrir les
        événements à venir.
      </p>
      <a href="/" className={buttonVariants({ variant: 'default', size: 'lg', className: 'mt-8' })}>
        Retour à l'accueil
      </a>
    </main>
  )
}

import { Logo } from '@/components/layout/Logo'

// Page « Conditions Générales » — placeholder.
// Le contenu complet du contrat de prestation et des CGU arrive en Phase 11.
export default function CguPage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background px-4 py-12">
      <a href="/" className="mb-8 flex items-center gap-2 font-semibold tracking-tight">
        <Logo className="h-9 w-9 shrink-0" />
        kinPass
      </a>
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-8">
        <h1 className="text-2xl font-bold tracking-tight">Conditions Générales</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Ce document est en cours de rédaction. Il présentera les conditions
          d’utilisation de kinPass, la politique de confidentialité, ainsi que
          le contrat de prestation et les règles de reversement (commission
          kinPass, calendrier des retraits, responsabilités, gestion des
          annulations et remboursements).
        </p>
      </div>
    </main>
  )
}

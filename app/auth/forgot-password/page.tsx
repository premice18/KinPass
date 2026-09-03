import { Logo } from '@/components/layout/Logo'

// Page « Mot de passe oublié » — placeholder.
// L'envoi d'email de réinitialisation arrive en Phase 11 (Confiance & conformité).
export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <a href="/" className="mb-8 flex items-center gap-2 font-semibold tracking-tight">
        <Logo className="h-9 w-9 shrink-0" />
        kinPass
      </a>
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-center">
        <h1 className="text-xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La réinitialisation par email arrive bientôt. En attendant, contactez
          notre support pour retrouver l’accès à votre compte.
        </p>
      </div>
    </main>
  )
}

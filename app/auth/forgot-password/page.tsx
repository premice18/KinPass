'use client'

// ────────────────────────────────────────────────────────────────────────────
// Demande de réinitialisation — /auth/forgot-password (Phase 11.5).
//
// Anti-énumération : le message affiché est IDENTIQUE que l'email existe ou
// non (l'action serveur renvoie toujours la même réponse générique).
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { Mail, Refresh } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { AuthShell } from '@/components/features/auth/AuthShell'
import { requestPasswordReset } from '@/lib/actions/password-reset'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Adresse email invalide.')
      return
    }
    startTransition(async () => {
      const result = await requestPasswordReset({ email: email.trim() })
      if (!result.success) {
        setError(result.error)
        return
      }
      // Toujours le même message générique (anti-énumération).
      setMessage(result.message)
    })
  }

  return (
    <AuthShell error={error}>
      <Eyebrow>Espace organisateur</Eyebrow>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Mot de passe oublié</h1>

      {message ? (
        <div
          role="status"
          data-testid="forgot-success"
          className="mt-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300"
        >
          {message}
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Indiquez l’adresse de votre compte : si elle existe, vous recevrez un lien de
            réinitialisation valable 1 heure.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <label className="block space-y-2 text-sm font-medium">
              Adresse email
              <span className="relative block">
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.cd"
                  className="pl-9"
                  data-testid="forgot-email"
                />
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </span>
            </label>

            <Button type="submit" disabled={isPending} className="w-full" data-testid="forgot-submit">
              {isPending ? (
                <>
                  <Refresh className="h-4 w-4 animate-spin" />
                  Envoi…
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
              )}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </a>
      </p>
    </AuthShell>
  )
}

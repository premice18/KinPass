'use client'

// ────────────────────────────────────────────────────────────────────────────
// Formulaire de réinitialisation — /auth/reset-password?token=… (Phase 11.5).
// Le token est fourni par la page serveur (pas de lecture client des params).
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { Refresh } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { AuthShell } from '@/components/features/auth/AuthShell'
import { resetPassword } from '@/lib/actions/password-reset'

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Validation locale (miroir de `passwordSchema`).
  const clientValidate = (): string | null => {
    if (password.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
    if (!/[A-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une majuscule.'
    if (!/[a-z]/.test(password)) return 'Le mot de passe doit contenir au moins une minuscule.'
    if (!/[0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.'
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas.'
    return null
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const localError = clientValidate()
    if (localError) {
      setError(localError)
      return
    }
    startTransition(async () => {
      const result = await resetPassword({ token, password })
      if (!result.success) {
        setError(result.error)
        return
      }
      setDone(true)
    })
  }

  // Token absent → lien invalide, sans formulaire.
  if (!token) {
    return (
      <AuthShell error="Lien invalide ou incomplet. Demandez un nouveau lien de réinitialisation.">
        <Eyebrow>Espace organisateur</Eyebrow>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Lien invalide</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <a href="/auth/forgot-password" className="font-medium text-primary hover:underline">
            Demander un nouveau lien
          </a>
        </p>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell>
        <div role="status" data-testid="reset-success">
          <Eyebrow>Espace organisateur</Eyebrow>
          <h1 className="mt-3 text-2xl font-bold tracking-tight">Mot de passe modifié</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre nouveau mot de passe est actif. Vous pouvez vous connecter dès maintenant.
          </p>
          <a
            href="/auth/login"
            className="mt-6 inline-flex h-8 w-full items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
          >
            Se connecter
          </a>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell error={error}>
      <Eyebrow>Espace organisateur</Eyebrow>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        8 caractères minimum, avec majuscule, minuscule et chiffre.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm font-medium">
          Nouveau mot de passe
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            data-testid="reset-password"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Confirmer le mot de passe
          <PasswordInput
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            data-testid="reset-confirm"
          />
        </label>

        <Button type="submit" disabled={isPending} className="w-full" data-testid="reset-submit">
          {isPending ? (
            <>
              <Refresh className="h-4 w-4 animate-spin" />
              Enregistrement…
            </>
          ) : (
            'Enregistrer le nouveau mot de passe'
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Retour à la connexion
        </a>
      </p>
    </AuthShell>
  )
}

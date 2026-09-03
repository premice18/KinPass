'use client'

// ────────────────────────────────────────────────────────────────────────────
// Formulaire de connexion (Phase 4.1, adapté Auth.js 4.2).
//
// Deux voies :
// - « Continuer avec Google » : flux OAuth Auth.js (`signIn("google")`).
// - Email + mot de passe : `signIn("credentials")` (Auth.js, bcrypt vérifié
//   côté serveur par le provider).
// En cas de succès → redirection vers `?next=` ou le dashboard.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Mail } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { AuthShell } from '@/components/features/auth/AuthShell'
import { GoogleButton } from '@/components/features/auth/GoogleButton'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const view = searchParams.get('view')
  // Erreur posée par Auth.js après un échec OAuth (ex. AccessDenied).
  const oauthError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(oauthError ? 'La connexion a échoué. Réessayez.' : '')
  const [isPending, startTransition] = useTransition()

  // Validation locale (miroir de `loginSchema`).
  const clientValidate = (): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Adresse email invalide.'
    if (!password) return 'Le mot de passe est obligatoire.'
    return null
  }

  // Connexion email + mot de passe via le provider credentials d'Auth.js.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const localError = clientValidate()
    if (localError) {
      setError(localError)
      return
    }

    startTransition(async () => {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })
      if (!result || result.error) {
        // Code générique Auth.js (CredentialsSignin) → message neutre.
        setError('Identifiants invalides.')
        return
      }
      router.push(next ?? `/?view=${view ?? 'dashboard'}`)
      router.refresh()
    })
  }

  return (
    <AuthShell error={error} pending={isPending}>
      <Eyebrow>Espace organisateur</Eyebrow>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Connexion</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Accédez à votre tableau de bord kinPass.
      </p>

      <div className="mt-6">
        <GoogleButton />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        ou avec un email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
            />
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </span>
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Mot de passe
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <div className="text-right text-sm">
          {/* Réinitialisation par email : prévue en Phase 11 */}
          <a href="/auth/forgot-password" className="text-primary hover:underline">
            Mot de passe oublié ?
          </a>
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <a href="/auth/register" className="font-medium text-primary hover:underline">
          Créer un compte organisateur
        </a>
      </p>
    </AuthShell>
  )
}

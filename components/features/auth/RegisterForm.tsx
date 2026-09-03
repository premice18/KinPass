'use client'

// ────────────────────────────────────────────────────────────────────────────
// Formulaire d'inscription organisateur (phase 4.1).
//
// Champs : email, nom complet, mot de passe (+ confirmation), case
// d'acceptation des CGU (le contrat complet arrive en Phase 11 — lien vers
// une page « en préparation »). Validation locale miroir de `registerSchema`.
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, User } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Eyebrow } from '@/components/ui/eyebrow'
import { AuthShell } from '@/components/features/auth/AuthShell'
import { register } from '@/lib/actions/auth'

// Politique de mot de passe (reflète `registerSchema`).
const passwordRules = [
  { test: (p: string) => p.length >= 8, label: '8 caractères minimum' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'une majuscule' },
  { test: (p: string) => /[a-z]/.test(p), label: 'une minuscule' },
  { test: (p: string) => /[0-9]/.test(p), label: 'un chiffre' },
]

export function RegisterForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const clientValidate = (): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Adresse email invalide.'
    if (fullName.trim().length < 2) return 'Le nom complet est obligatoire.'
    const rule = passwordRules.find((r) => !r.test(password))
    if (rule) return `Le mot de passe doit contenir ${rule.label}.`
    if (confirmPassword !== password) return 'Les mots de passe ne correspondent pas.'
    if (!acceptTerms) return 'Vous devez accepter les Conditions Générales.'
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
      const result = await register({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        confirmPassword,
        // La validation locale garantit que la case est cochée ici.
        acceptTerms: true,
      })
      if (!result.success) {
        setError(result.error)
        return
      }
      // Compte créé et session posée : direction le dashboard.
      router.push('/?view=dashboard')
      router.refresh()
    })
  }

  return (
    <AuthShell error={error} pending={isPending}>
      <Eyebrow>Espace organisateur</Eyebrow>
      <h1 className="mt-3 text-2xl font-bold tracking-tight">Créer un compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Commencez à créer et vendre vos événements.
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
            />
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </span>
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Nom complet
          <span className="relative block">
            <Input
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex. Jean-Marc Kabasele"
              className="pl-9"
            />
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </span>
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Mot de passe
          <PasswordInput
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8 caractères min, majuscule, minuscule, chiffre"
          />
        </label>

        <label className="block space-y-2 text-sm font-medium">
          Confirmer le mot de passe
          <PasswordInput
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Reprenez le mot de passe"
          />
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-[var(--primary)]"
          />
          <span>
            J’accepte les{' '}
            <a href="/legal/cgu" className="text-primary hover:underline" target="_blank" rel="noreferrer">
              Conditions Générales
            </a>{' '}
            et les règles de reversement.
          </span>
        </label>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? 'Création du compte…' : 'Créer mon compte'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <a href="/auth/login" className="font-medium text-primary hover:underline">
          Se connecter
        </a>
      </p>
    </AuthShell>
  )
}

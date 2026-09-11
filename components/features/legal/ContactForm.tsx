'use client'

// ────────────────────────────────────────────────────────────────────────────
// Formulaire de contact (Phase 11.1) — envoi vers la boîte kinPass via la
// Server Action `sendContactMessage` (rate-limit + replyTo côté serveur).
// ────────────────────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import { CheckCircle, Refresh, Send, WarningCircle } from 'iconoir-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { sendContactMessage, type ContactInput } from '@/lib/actions/contact'

const SUBJECTS: Array<{ value: ContactInput['subject']; label: string }> = [
  { value: 'bug', label: 'Bug / problème technique' },
  { value: 'organisateur', label: 'Question organisateur' },
  { value: 'acheteur', label: 'Question acheteur / billet' },
  { value: 'partenariat', label: 'Partenariat' },
  { value: 'autre', label: 'Autre' },
]

const fieldClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState<ContactInput['subject']>('organisateur')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await sendContactMessage({ name, email, subject, message })
      if (!result.success) {
        setError(result.error)
        return
      }
      setSent(true)
    })
  }

  // Accusé de réception (jamais de faux « support automatique »).
  if (sent) {
    return (
      <div
        role="status"
        data-testid="contact-success"
        className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-6 text-center"
      >
        <CheckCircle className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-3 font-semibold text-emerald-700 dark:text-emerald-300">Message envoyé</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Merci {name.split(' ')[0]} — notre équipe vous répond sous 24 à 48 heures ouvrées à
          l’adresse indiquée.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="contact-form">
      {error && (
        <div
          role="alert"
          data-testid="contact-error"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <WarningCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2 text-sm font-medium">
          Votre nom
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Jean-Marc Kabongo"
            autoComplete="name"
            required
            data-testid="contact-name"
          />
        </label>
        <label className="block space-y-2 text-sm font-medium">
          Votre email
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.cd"
            autoComplete="email"
            required
            data-testid="contact-email"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium">
        Sujet
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value as ContactInput['subject'])}
          className={fieldClass}
          data-testid="contact-subject"
        >
          {SUBJECTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2 text-sm font-medium">
        Votre message
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${fieldClass} min-h-32`}
          placeholder="Décrivez votre demande (10 caractères minimum)…"
          required
          data-testid="contact-message"
        />
      </label>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto" data-testid="contact-submit">
        {isPending ? (
          <>
            <Refresh className="h-4 w-4 animate-spin" />
            Envoi…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Envoyer le message
          </>
        )}
      </Button>
    </form>
  )
}

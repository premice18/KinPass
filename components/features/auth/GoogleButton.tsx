'use client'

// ────────────────────────────────────────────────────────────────────────────
// Bouton « Continuer avec Google ».
//
// Déclenche le flux OAuth Auth.js (`signIn("google")`). Le logo officiel
// Google est un SVG de marque (pas un emoji). `redirectTo` ramène sur la
// coquille après la redirection OAuth.
// ────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Refresh } from 'iconoir-react'

// Logo officiel « G » Google (couleurs de marque, SVG inline).
function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.67-.22-2.46H12v4.65h6.46a5.56 5.56 0 0 1-2.4 3.65v3h3.87c2.27-2.1 3.57-5.17 3.57-8.84Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.29a12 12 0 0 0 0 10.78l3.98-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.97 11.97 0 0 0 1.29 6.6l3.98 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}

interface GoogleButtonProps {
  className?: string
}

export function GoogleButton({ className }: GoogleButtonProps) {
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    setPending(true)
    // Le flux OAuth redirige vers Google puis revient sur la coquille
    // (dashboard pour un organisateur).
    await signIn('google', { redirectTo: '/?view=dashboard' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-border bg-background text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {pending ? (
        <Refresh className="h-4 w-4 animate-spin" />
      ) : (
        <GoogleLogo className="h-4 w-4" />
      )}
      Continuer avec Google
    </button>
  )
}

'use client'

// ────────────────────────────────────────────────────────────────────────────
// Champ mot de passe avec œil « afficher / masquer ».
//
// Un bouton œil (Iconoir `Eye` / `EyeClosed`) à droite du champ bascule le
// type `password` ↔ `text`. Accessibilité : aria-label FR dynamique, bouton
// de type `button` (ne soumet pas le formulaire).
// ────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { Eye, EyeClosed } from 'iconoir-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface PasswordInputProps extends React.ComponentProps<typeof Input> {}

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <span className="relative block">
      <Input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-10', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {visible ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </span>
  )
}

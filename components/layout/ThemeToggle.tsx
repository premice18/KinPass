'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { HalfMoon, SunLight } from 'iconoir-react'
import { Button } from '@/components/ui/button'

/**
 * Bascule clair / sombre. Utilise next-themes (persistance localStorage +
 * préférence système). Rendu différé (mounted) pour éviter l'hydratation mismatch.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Changer de thème" className="opacity-0" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <SunLight className="h-4 w-4" /> : <HalfMoon className="h-4 w-4" />}
    </Button>
  )
}

'use client'

// ────────────────────────────────────────────────────────────────────────────
// Enregistrement du service worker (Phase 8 — PWA).
//
// Enregistré uniquement en production (évite la mise en cache pendant le
// développement). Le fichier /sw.js est servi statiquement depuis /public.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    // Enregistrement différé : la page reste prioritaire.
    const id = window.setTimeout(() => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW indisponible (contexte, navigateur) : silencieux — non bloquant.
      })
    }, 3000)
    return () => window.clearTimeout(id)
  }, [])

  return null
}

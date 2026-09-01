'use client'

// ────────────────────────────────────────────────────────────────────────────
// Hook client — chargement d'images Pexels via le proxy serveur.
//
// Les composants l'utilisent pour obtenir des photos de couverture. Si la clé
// API est absente (ou l'API en erreur), le hook retourne une liste vide et le
// composant affiche son fallback de marque.
// ────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

import type { PexelsImage } from '@/lib/pexels'

export function usePexelsImages(query: string | null, perPage = 3) {
  const [images, setImages] = useState<PexelsImage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!query) return
    let cancelled = false

    setLoading(true)
    fetch(`/api/pexels?query=${encodeURIComponent(query)}&per_page=${perPage}`)
      .then((response) => response.json())
      .then((data: { images?: PexelsImage[] }) => {
        if (!cancelled) setImages(data.images ?? [])
      })
      .catch(() => {
        // Erreur silencieuse : le fallback de marque s'affichera.
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query, perPage])

  return { images, loading }
}

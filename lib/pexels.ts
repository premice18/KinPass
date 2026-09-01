import 'server-only'

// ────────────────────────────────────────────────────────────────────────────
// Client API Pexels (côté serveur uniquement).
//
// La clé `PEXELS_API_KEY` n'est jamais exposée au client : l'appel est fait
// ici, côté serveur, et relayé au navigateur via la route handler
// `app/api/pexels/route.ts`.
//
// Si la clé est absente ou si l'API échoue, on retourne une liste vide : les
// composants client basculent alors sur leur fallback (placeholder de marque).
// ────────────────────────────────────────────────────────────────────────────

export type PexelsImage = {
  id: number
  src: string
  alt: string
  photographer: string
  width: number
  height: number
}

const PEXELS_API_KEY = process.env.PEXELS_API_KEY
const PEXELS_API_URL = 'https://api.pexels.com/v1/search'

// Récupère des photos libres de droits depuis Pexels pour un mot-clé donné.
// Résultat mis en cache 1 heure (revalidate) pour limiter la consommation API.
export async function fetchPexelsImages(
  query: string,
  perPage = 5,
): Promise<PexelsImage[]> {
  if (!PEXELS_API_KEY) return []

  try {
    const response = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: { Authorization: PEXELS_API_KEY },
        // Cache ISR : la requête est rejouée au plus une fois par heure.
        next: { revalidate: 3600 },
      },
    )
    if (!response.ok) return []

    const data = (await response.json()) as {
      photos?: Array<{
        id: number
        src: { medium: string }
        alt: string | null
        photographer: string | null
        width: number
        height: number
      }>
    }

    return (data.photos ?? []).map((photo) => ({
      id: photo.id,
      // `medium` = ~400 px de large, léger et suffisant pour les cartes/hero.
      src: photo.src.medium,
      alt: photo.alt ?? '',
      photographer: photo.photographer ?? '',
      width: photo.width,
      height: photo.height,
    }))
  } catch {
    // Panne réseau ou API : on retombe proprement sur les placeholders.
    return []
  }
}

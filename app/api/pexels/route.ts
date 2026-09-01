import { NextResponse } from 'next/server'

import { fetchPexelsImages } from '@/lib/pexels'

// ────────────────────────────────────────────────────────────────────────────
// Route handler — proxy Pexels.
//
// Le navigateur appelle `/api/pexels?query=...&per_page=...` ; la clé API reste
// côté serveur (jamais exposée au client). Retourne `{ images: [...] }`.
// ────────────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')?.trim() ?? 'concert'
  const perPage = Math.min(Math.max(Number(searchParams.get('per_page')) || 5, 1), 10)

  const images = await fetchPexelsImages(query, perPage)
  return NextResponse.json({ images })
}

import { NextResponse, type NextRequest } from 'next/server'

import { SESSION_COOKIE, verifySessionToken } from '@/lib/session-token'

// ────────────────────────────────────────────────────────────────────────────
// Proxy (convention Next 16 — remplace `middleware.ts`) — garde d'accès.
//
// - Routes protégées (organisateur) : `/dashboard`, `/events/*` — redirigent
//   vers `/auth/login?next=...` si aucun token de session valide.
// - Pages publiques d'auth : `/auth/*` — redirigent un utilisateur déjà
//   connecté vers son dashboard (évite de revoir le login).
//
// NB : ce garde-fou est une première barrière ; chaque Server Action sensible
// revérifie le rôle ET la propriété des ressources en base (défense en
// profondeur, cf. `lib/actions/events.ts`).
// ────────────────────────────────────────────────────────────────────────────

// Vérifie le token sans toucher à la base (léger, compatible Edge).
async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return (await verifySessionToken(token)) !== null
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authenticated = await isAuthenticated(request)

  // Routes protégées de l'espace organisateur.
  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/events')

  if (isProtected && !authenticated) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Un utilisateur connecté n'a pas à revoir les pages d'authentification.
  const isAuthPage = pathname.startsWith('/auth')
  if (isAuthPage && authenticated) {
    const url = new URL('/', request.url)
    url.searchParams.set('view', 'dashboard')
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Ne fait tourner le proxy que sur les chemins concernés.
export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*', '/scan/:path*', '/auth/:path*'],
}

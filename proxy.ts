import NextAuth from 'next-auth'

import { authConfig } from '@/auth.config'

// ────────────────────────────────────────────────────────────────────────────
// Proxy (convention Next 16) — garde d'accès via Auth.js.
//
// La logique de redirection (routes protégées, pages /auth/*) est portée par
// le callback `authorized` de `auth.config.ts` (compatible Edge). On utilise
// uniquement `authConfig` ici — jamais les providers Node (credentials/bcrypt)
// ni la base de données.
// ────────────────────────────────────────────────────────────────────────────

export default NextAuth(authConfig).auth

// Ne fait tourner le proxy que sur les chemins concernés.
export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*', '/scan/:path*', '/auth/:path*'],
}

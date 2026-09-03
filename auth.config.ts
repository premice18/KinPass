// ────────────────────────────────────────────────────────────────────────────
// Configuration Auth.js — partie compatible Edge (proxy).
//
// Attention : ce fichier ne doit RIEN importer qui touche à la base de
// données ou à bcrypt (runtime Edge). Les providers complets (Google +
// credentials) et les callbacks « node » vivent dans `auth.ts`.
//
// `authorized` : garde d'accès par route (équivalent de l'ancien proxy jose) :
// - routes protégées organisateur → redirection /auth/login?next=...
// - pages /auth/* → redirection vers le dashboard si déjà connecté.
// ────────────────────────────────────────────────────────────────────────────

import type { NextAuthConfig } from 'next-auth'
import { NextResponse } from 'next/server'

export const authConfig = {
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  providers: [
    // Les providers sont déclarés dans `auth.ts` ; ici (edge) aucun provider
    // n'est nécessaire pour vérifier une session existante.
  ],
  callbacks: {
    // Copie `id` et `role` du jeton vers la session (sans toucher à la base).
    session({ session, token }) {
      // Le jeton Auth.js a un index signature ; on extrait nos champs métier.
      const kinPassToken = token as { id?: string; role?: string }
      if (kinPassToken.id) session.user.id = kinPassToken.id
      if (kinPassToken.role) session.user.role = kinPassToken.role
      return session
    },
    // Garde d'accès (exécuté côté proxy).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLoggedIn = Boolean(auth?.user)

      const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/events')
      if (isProtected && !isLoggedIn) {
        const url = new URL('/auth/login', request.nextUrl)
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
      }

      const isAuthPage = pathname.startsWith('/auth')
      if (isAuthPage && isLoggedIn) {
        const url = new URL('/', request.nextUrl)
        url.searchParams.set('view', 'dashboard')
        return NextResponse.redirect(url)
      }

      return true
    },
  },
} satisfies NextAuthConfig

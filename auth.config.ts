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
    // Garde d'accès (exécuté côté proxy) — RBAC par rôle (Phase 7.2).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isLoggedIn = Boolean(auth?.user)
      // Rôle stocké dans le jeton (jamais déduit de l'email).
      const role = (auth?.user as { role?: string } | undefined)?.role

      // Routes organisateur (dashboard, gestion) : ORGANIZER uniquement.
      const isOrganizerRoute =
        pathname.startsWith('/dashboard') ||
        pathname.startsWith('/events') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/payouts')
      if (isOrganizerRoute) {
        // Non connecté → login. Agent → jamais accès organisateur.
        if (!isLoggedIn) {
          const url = new URL('/auth/login', request.nextUrl)
          url.searchParams.set('next', pathname)
          return NextResponse.redirect(url)
        }
        if (role !== 'organizer') {
          // Agent (ou autre) : redirection vers SON espace.
          const url = new URL(role === 'agent' ? '/scan' : '/', request.nextUrl)
          return NextResponse.redirect(url)
        }
      }

      // Espace scanneur : AGENT uniquement (l'organisateur ne scanne pas).
      if (pathname.startsWith('/scan')) {
        if (!isLoggedIn) {
          const url = new URL('/auth/login', request.nextUrl)
          url.searchParams.set('next', pathname)
          return NextResponse.redirect(url)
        }
        if (role !== 'agent') {
          const url = new URL('/', request.nextUrl)
          return NextResponse.redirect(url)
        }
      }

      // Pages d'authentification : déjà connecté → son espace selon le rôle.
      const isAuthPage = pathname.startsWith('/auth')
      if (isAuthPage && isLoggedIn) {
        const url = new URL(role === 'agent' ? '/scan' : '/', request.nextUrl)
        if (role !== 'agent') url.searchParams.set('view', 'dashboard')
        return NextResponse.redirect(url)
      }

      return true
    },
  },
} satisfies NextAuthConfig

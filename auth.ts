// ────────────────────────────────────────────────────────────────────────────
// Auth.js v5 — configuration complète (runtime Node).
//
// Deux providers :
// - `credentials` : email + mot de passe (bcryptjs) — compte `provider='email'`.
// - `google` : OAuth Google — compte créé/liaison par email (`provider='google'`
//   ou liaison sur un compte email existant).
//
// Callbacks :
// - `jwt` : à la connexion, injecte l'id kinPass et le rôle (résolus en base
//   pour Google ; fournis par `authorize` pour credentials).
// - `session`/`authorized` : cf. `auth.config.ts`.
// ────────────────────────────────────────────────────────────────────────────

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { generateUserSlug } from '@/lib/db/user-slug'
import { clearAttempts, isRateLimited, recordAttempt } from '@/lib/rate-limit'
import { verifyPassword } from '@/lib/password'
import { authConfig } from '@/auth.config'

// Trouve un utilisateur par email (compte email/password ou Google).
async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return user ?? null
}

// Crée un utilisateur issu de Google (email inconnu) ou lie le compte Google
// à un compte email existant (même email → même compte, pas de doublon).
// À chaque connexion, la photo Google (`image`) rafraîchit `avatarUrl`.
async function upsertGoogleUser(
  email: string,
  fullName: string | null | undefined,
  googleId?: string,
  image?: string | null | undefined,
) {
  const existing = await findUserByEmail(email)
  if (existing) {
    // Rafraîchit l'avatar (et l'id du provider) si Google en fournit un.
    if (image || googleId) {
      await db
        .update(users)
        .set({
          avatarUrl: image ?? existing.avatarUrl,
          providerId: googleId ?? existing.providerId,
        })
        .where(eq(users.id, existing.id))
    }
    return existing
  }

  const createdName = fullName?.trim() || email.split('@')[0] || 'Utilisateur Google'
  const [created] = await db
    .insert(users)
    .values({
      email,
      // Slug public unique (Phase 9.5) — généré à la création du compte.
      slug: await generateUserSlug(createdName),
      fullName: createdName,
      passwordHash: null,
      provider: 'google',
      providerId: googleId ?? null,
      // Avatar automatique : photo du compte Google (Phase 4.3).
      avatarUrl: image ?? null,
    })
    .returning()
  return created
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      // Le provider credentials n'est pas compatible Edge : les callbacks
      // ci-dessous ne s'exécutent qu'en runtime Node.
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase()
        const password = String(credentials?.password ?? '')
        if (!email || !password) return null

        // ── Rate-limit (Phase 8) : 5 échecs / 5 min par email — bloque le
        // brute-force des comptes agents (emails prévisibles). NB : fenêtre
        // par instance (voir lib/rate-limit.ts).
        const WINDOW_MS = 5 * 60 * 1000
        const MAX_ATTEMPTS = 5
        if (isRateLimited(email, MAX_ATTEMPTS, WINDOW_MS)) return null

        const user = await findUserByEmail(email)
        // Compte Google pur : pas de mot de passe → refus sur ce provider.
        if (!user || !user.passwordHash) {
          recordAttempt(email, WINDOW_MS)
          return null
        }
        // Compte désactivé (agent suspendu par l'organisateur, Phase 7.1) :
        // refus avec le même message générique (pas d'énumération).
        if (user.active === false) {
          recordAttempt(email, WINDOW_MS)
          return null
        }
        if (!verifyPassword(password, user.passwordHash)) {
          recordAttempt(email, WINDOW_MS)
          return null
        }

        // Succès : on réinitialise le compteur d'échecs.
        clearAttempts(email)
        return { id: user.id, email: user.email, name: user.fullName, role: user.role }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Injecte id/role kinPass dans le jeton au moment de la connexion.
    async jwt({ token, user, account }) {
      if (user && !token.id) {
        if (account?.provider === 'google') {
          // Google : l'utilisateur n'existe pas forcément en base → création
          // ou liaison par email, puis on récupère l'id/le rôle kinPass.
          // La photo de profil Google est stockée/rafraîchie automatiquement.
          const dbUser = await upsertGoogleUser(
            user.email ?? '',
            user.name,
            account.providerAccountId,
            user.image,
          )
          token.id = dbUser.id
          token.role = dbUser.role
        } else {
          // Credentials : `user` est déjà notre utilisateur en base.
          token.id = user.id
          token.role = user.role ?? 'organizer'
        }
      }
      return token
    },
  },
})

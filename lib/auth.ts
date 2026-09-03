import 'server-only'

// ────────────────────────────────────────────────────────────────────────────
// Authentification — phase 4.1 (session, hash, utilisateur courant)
//
// - Hash des mots de passe avec `bcryptjs` (pur JS, aucune compilation native).
// - Session : JWT signé (HS256, `jose`) stocké dans un cookie `httpOnly`.
//   Payload minimal : `{ sub: userId, role }`. Le rôle est relu en base à
//   chaque requête sensible (défense en profondeur, cf. `getCurrentUser`).
// - `AUTH_SECRET` : clé de signature (>= 32 caractères), variable d'env.
// ────────────────────────────────────────────────────────────────────────────

import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users, type User } from '@/lib/db/schema'
import {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
} from '@/lib/session-token'

// Ré-export pour les appels existants (la logique JWT vit dans
// `lib/session-token.ts`, compatible Edge pour le proxy).
export { SESSION_COOKIE, createSessionToken, verifySessionToken }

// Hash d'un mot de passe (bcrypt, coût 10 par défaut).
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

// Compare un mot de passe en clair avec son hash.
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

// Pose le cookie de session sur la réponse.
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

// Supprime le cookie de session (déconnexion).
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

// Charge l'utilisateur courant depuis la session (base de données).
// Retourne `null` si non connecté, session invalide ou utilisateur absent.
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await verifySessionToken(token)
  if (!session) return null

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1)
  return user ?? null
}


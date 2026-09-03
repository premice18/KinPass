import 'server-only'

// ────────────────────────────────────────────────────────────────────────────
// Authentification — utilisateur courant (Auth.js v5).
//
// `getCurrentUser` lit la session Auth.js puis recharge l'utilisateur en base
// (fraîcheur du rôle, détection de suspension). Utilisé par les Server Actions
// (events) et la route /api/auth/me.
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { auth } from '@/auth'
import { db } from '@/lib/db'
import { users, type User } from '@/lib/db/schema'

// Charge l'utilisateur courant depuis la session Auth.js (base de données).
// Retourne `null` si non connecté ou utilisateur absent.
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ?? null
}

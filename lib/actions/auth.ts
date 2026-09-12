'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Authentification (Phase 4.1, adaptée Auth.js 4.2)
//
// `register` : crée un compte organisateur `provider='email'` (email unique
// vérifié en base, mot de passe hashé bcrypt). La session est ensuite établie
// côté client via `signIn('credentials')` (Auth.js).
//
// NB : `login`/`logout` passent désormais par Auth.js côté client
// (`signIn`/`signOut` de next-auth/react) — plus de cookie maison.
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { generateUserSlug } from '@/lib/db/user-slug'
import { recordAcceptance } from '@/lib/actions/contracts'
import { CGU_VERSION } from '@/lib/constants'
import { hashPassword } from '@/lib/password'
import { registerSchema, type RegisterInput } from '@/lib/validators/auth'

export type AuthResult =
  | { success: true; user: { id: string; email: string; fullName: string; role: string } }
  | { success: false; error: string }

// Extrait le premier message d'erreur Zod.
function firstZodErrorMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

// Crée un compte organisateur (email + mot de passe). La connexion est ensuite
// faite côté client (signIn credentials) pour poser la session Auth.js.
export async function register(input: RegisterInput): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  // Unicité de l'email (contrainte UNIQUE en base, vérifiée ici pour un
  // message clair en français).
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1)
  if (existing.length > 0) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' }
  }

  try {
    // Slug public unique (page `/o/[slug]`, Phase 9.5) — généré une fois,
    // jamais modifié ensuite pour ne pas casser les liens publics.
    const slug = await generateUserSlug(data.fullName)
    const [created] = await db
      .insert(users)
      .values({
        email: data.email,
        slug,
        fullName: data.fullName,
        passwordHash: hashPassword(data.password),
        role: 'organizer',
        provider: 'email',
      })
      .returning()

    // Phase 11.2 : l'acceptation de la CGU (case obligatoire à l'inscription)
    // est TRACÉE (document + version) — l'acceptation des règles de
    // reversement se fera au moment utile (première publication/retrait).
    await recordAcceptance(created.id, 'cgu', CGU_VERSION)

    return {
      success: true,
      user: { id: created.id, email: created.email, fullName: created.fullName, role: created.role },
    }
  } catch {
    return { success: false, error: 'Impossible de créer le compte. Réessayez.' }
  }
}

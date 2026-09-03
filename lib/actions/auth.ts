'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Authentification (phase 4.1)
//
// `register` : crée un compte organisateur (email unique vérifié en base).
// `login` : vérifie email + mot de passe, pose la session.
// `logout` : supprime la session.
//
// Retour : `ActionResult` avec succès/erreur ; en cas de succès, le cookie de
// session est posé et la redirection est laissée au formulaire client (il
// connaît la page de destination : `?view=dashboard` ou `?next=`).
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth'
import {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from '@/lib/validators/auth'

export type AuthResult = { success: true; user: { id: string; email: string; fullName: string; role: string } } | { success: false; error: string }

// Extrait le premier message d'erreur Zod.
function firstZodErrorMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

// Crée un compte organisateur puis connecte l'utilisateur.
export async function register(input: RegisterInput): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  // Unicité de l'email (contrainte UNIQUE en base, vérifiée ici pour un
  // message clair en français).
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1)
  if (existing.length > 0) {
    return { success: false, error: 'Un compte existe déjà avec cet email.' }
  }

  try {
    const [created] = await db
      .insert(users)
      .values({
        email: data.email,
        fullName: data.fullName,
        passwordHash: hashPassword(data.password),
        role: 'organizer',
      })
      .returning()

    const token = await createSessionToken(created)
    await setSessionCookie(token)

    return {
      success: true,
      user: { id: created.id, email: created.email, fullName: created.fullName, role: created.role },
    }
  } catch {
    return { success: false, error: "Impossible de créer le compte. Réessayez." }
  }
}

// Connecte un utilisateur existant (organisateur ou agent).
export async function login(input: LoginInput): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  const [user] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)
  // Message volontairement générique : ne pas révéler si l'email existe.
  if (!user || !verifyPassword(data.password, user.passwordHash)) {
    return { success: false, error: 'Identifiants invalides.' }
  }

  const token = await createSessionToken(user)
  await setSessionCookie(token)

  return {
    success: true,
    user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
  }
}

// Déconnecte l'utilisateur courant.
export async function logout(): Promise<void> {
  await clearSessionCookie()
}

// ────────────────────────────────────────────────────────────────────────────
// Slug public d'un organisateur (route `/o/[slug]`, Phase 9.5).
//
// Généré automatiquement à la création du compte (inscription email ou
// Google) depuis le nom complet : `slugify(fullName)`, suffixé aléatoirement
// si déjà pris. Contrairement au slug d'événement, il n'est JAMAIS régénéré
// ensuite (le nom peut changer, les liens publics restent stables).
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { randomSuffix, slugify } from '@/lib/slug'

// Génère un slug public unique pour un utilisateur-organisateur.
// `executor` permet de passer le client de transaction si besoin.
export async function generateUserSlug(
  fullName: string,
  executor: Pick<typeof db, 'select'> = db,
): Promise<string> {
  const base = slugify(fullName) || 'organisateur'
  // Jusqu'à 4 tentatives avant le repli garanti (suffixe aléatoire).
  for (let attempt = 0; attempt < 4; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${randomSuffix()}`
    const existing = await executor
      .select({ id: users.id })
      .from(users)
      .where(eq(users.slug, candidate))
      .limit(1)
    if (existing.length === 0) return candidate
  }
  return `${base}-${randomSuffix()}`
}

'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Page publique organisateur (Phase 9.5, route `/o/[slug]`)
//
// Charge le profil PUBLIC d'un organisateur (nom, avatar, bio, site, réseau)
// depuis la section « Présence » du profil (Phase 4.3) + ses événements
// publiés à venir. Aucune session requise ; aucun champ privé exposé.
// ────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { loadPublicEventCards, type PublicEventCard } from '@/lib/actions/events'

// Profil public d'un organisateur (champs marketing uniquement).
export type OrganizerPublicProfile = {
  slug: string
  fullName: string
  avatarUrl: string | null
  bio: string | null
  website: string | null
  instagram: string | null
  events: PublicEventCard[]
}

// Charge un organisateur public par son slug. Le badge « vérifié » arrivera
// avec la Phase 11 (vérification d'identité) — absent pour l'instant.
export async function getOrganizerPublicBySlug(
  slug: string,
): Promise<{ success: true; data: OrganizerPublicProfile } | { success: false; error: string }> {
  try {
    const [organizer] = await db
      .select()
      .from(users)
      .where(eq(users.slug, slug))
      .limit(1)
    // Un slug inconnu ou un compte non-organisateur n'a pas de page publique.
    if (!organizer || organizer.role !== 'organizer') {
      return { success: false, error: 'Organisateur introuvable.' }
    }

    // Événements publiés à venir du même organisateur (règles de la vitrine).
    const events = await loadPublicEventCards({ organizerId: organizer.id })

    return {
      success: true,
      data: {
        slug: organizer.slug!,
        fullName: organizer.fullName,
        avatarUrl: organizer.avatarUrl,
        bio: organizer.bio,
        website: organizer.website,
        instagram: organizer.instagram,
        events,
      },
    }
  } catch {
    return { success: false, error: 'Organisateur introuvable.' }
  }
}

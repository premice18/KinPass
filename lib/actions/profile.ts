'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Profil organisateur (Phase 4.3)
//
// Lecture/écriture du profil (avatar, WhatsApp, adresse) et gestion des
// comptes de reversement (1 à N méthodes Mobile Money / banque).
// Toutes les actions exigent une session organisateur.
// ────────────────────────────────────────────────────────────────────────────

import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { payoutMethods, users, type PayoutMethod } from '@/lib/db/schema'
import { generateUserSlug } from '@/lib/db/user-slug'
import { getCurrentUser } from '@/lib/auth'
import {
  addPayoutMethodSchema,
  updateProfileSchema,
  type AddPayoutMethodInput,
  type UpdateProfileInput,
} from '@/lib/validators/profile'

// Résultat standard (succès/erreur).
type ActionResult<T> = { success: true; data: T } | { success: false; error: string }

function firstZodErrorMessage(error: { issues: Array<{ message: string }> }): string {
  return error.issues[0]?.message ?? 'Données invalides.'
}

// Profil renvoyé au client.
export type ProfileData = {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  phoneWhatsapp: string | null
  address: string | null
  bio: string | null
  website: string | null
  instagram: string | null
  payoutMethods: PayoutMethod[]
  // Vrai si le profil est « complet » (reversement configuré + WhatsApp).
  complete: boolean
}

// Lecture du profil de l'organisateur connecté + ses comptes de reversement.
export async function getProfile(): Promise<ActionResult<ProfileData>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  const methods = await db
    .select()
    .from(payoutMethods)
    .where(eq(payoutMethods.userId, user.id))
    .orderBy(asc(payoutMethods.createdAt))

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      phoneWhatsapp: user.phoneWhatsapp,
      address: user.address,
      bio: user.bio,
      website: user.website,
      instagram: user.instagram,
      payoutMethods: methods,
      complete: methods.length > 0 && Boolean(user.phoneWhatsapp),
    },
  }
}

// Met à jour les champs du profil (champs fournis uniquement).
export async function updateProfile(input: UpdateProfileInput): Promise<ActionResult<ProfileData>> {
  const parsed = updateProfileSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    // Slug public : un compte créé avant la Phase 9.5 n'en a pas encore —
    // on le génère à la première mise à jour du profil (stable ensuite).
    const slug = user.slug ?? (await generateUserSlug(data.fullName ?? user.fullName))
    await db
      .update(users)
      .set({
        slug,
        fullName: data.fullName ?? user.fullName,
        phoneWhatsapp:
          data.phoneWhatsapp !== undefined ? data.phoneWhatsapp || null : user.phoneWhatsapp,
        address: data.address !== undefined ? data.address || null : user.address,
        bio: data.bio !== undefined ? data.bio || null : user.bio,
        website: data.website !== undefined ? data.website || null : user.website,
        instagram: data.instagram !== undefined ? data.instagram || null : user.instagram,
        avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl || null : user.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Retourne le profil à jour (relecture complète).
    return await getProfile()
  } catch {
    return { success: false, error: 'Impossible de mettre à jour le profil.' }
  }
}

// Ajoute un compte de reversement (le premier devient la méthode par défaut).
export async function addPayoutMethod(input: AddPayoutMethodInput): Promise<ActionResult<PayoutMethod[]>> {
  const parsed = addPayoutMethodSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    const existing = await db
      .select({ id: payoutMethods.id })
      .from(payoutMethods)
      .where(eq(payoutMethods.userId, user.id))
      .limit(1)

    const [created] = await db
      .insert(payoutMethods)
      .values({
        userId: user.id,
        provider: data.provider,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        // Première méthode → par défaut.
        isDefault: existing.length === 0,
      })
      .returning()

    return { success: true, data: await listPayoutMethods(user.id, created) }
  } catch {
    return { success: false, error: 'Impossible d’ajouter le compte de reversement.' }
  }
}

// Supprime un compte de reversement (interdit si c'est le seul : il faut
// toujours une méthode pour publier/recevoir les fonds).
export async function removePayoutMethod(methodId: string): Promise<ActionResult<PayoutMethod[]>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    const methods = await db
      .select()
      .from(payoutMethods)
      .where(eq(payoutMethods.userId, user.id))
      .orderBy(asc(payoutMethods.createdAt))
    if (methods.length <= 1) {
      return { success: false, error: 'Vous devez garder au moins un compte de reversement.' }
    }

    await db
      .delete(payoutMethods)
      .where(and(eq(payoutMethods.id, methodId), eq(payoutMethods.userId, user.id)))

    const remaining = await listPayoutMethods(user.id)
    return { success: true, data: remaining }
  } catch {
    return { success: false, error: 'Impossible de supprimer ce compte.' }
  }
}

// Modifie un compte de reversement existant (corriger un numéro, un
// titulaire ou changer de provider) — sans suppression/recréation.
export async function updatePayoutMethod(
  methodId: string,
  input: AddPayoutMethodInput,
): Promise<ActionResult<PayoutMethod[]>> {
  const parsed = addPayoutMethodSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstZodErrorMessage(parsed.error) }
  const data = parsed.data

  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    const [owned] = await db
      .select({ id: payoutMethods.id })
      .from(payoutMethods)
      .where(and(eq(payoutMethods.id, methodId), eq(payoutMethods.userId, user.id)))
      .limit(1)
    if (!owned) return { success: false, error: 'Compte de reversement introuvable.' }

    await db
      .update(payoutMethods)
      .set({
        provider: data.provider,
        accountName: data.accountName,
        accountNumber: data.accountNumber,
      })
      .where(eq(payoutMethods.id, methodId))

    return { success: true, data: await listPayoutMethods(user.id) }
  } catch {
    return { success: false, error: 'Impossible de modifier ce compte de reversement.' }
  }
}

// Définit la méthode par défaut (les autres passent à non-défaut).
export async function setDefaultPayoutMethod(methodId: string): Promise<ActionResult<PayoutMethod[]>> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    await db
      .update(payoutMethods)
      .set({ isDefault: false })
      .where(eq(payoutMethods.userId, user.id))
    await db
      .update(payoutMethods)
      .set({ isDefault: true })
      .where(and(eq(payoutMethods.id, methodId), eq(payoutMethods.userId, user.id)))

    return { success: true, data: await listPayoutMethods(user.id) }
  } catch {
    return { success: false, error: 'Impossible de changer la méthode par défaut.' }
  }
}

// Helper interne : liste des méthodes d'un organisateur.
async function listPayoutMethods(userId: string, toAppend?: PayoutMethod): Promise<PayoutMethod[]> {
  const rows = await db
    .select()
    .from(payoutMethods)
    .where(eq(payoutMethods.userId, userId))
    .orderBy(asc(payoutMethods.createdAt))
  // Si une méthode vient d'être créée, on la met en tête (la plus récente).
  return toAppend ? [toAppend, ...rows.filter((r) => r.id !== toAppend.id)] : rows
}

'use server'

// ────────────────────────────────────────────────────────────────────────────
// Server Actions — Acceptations légales (Phase 11.2 « consentement au bon
// moment »).
//
// Décision : pas de double signature à l'inscription. La CGU est acceptée à
// la création du compte (une case) ; les RÈGLES DE REVERSEMENT sont acceptées
// formellement au premier retrait (Phase 16) — et, en attendant, à la
// première publication d'événement (moment où l'organisateur s'engage).
// Chaque acceptation est tracée (document + version) dans
// `contract_acceptances` ; une nouvelle version impose une re-acceptation au
// prochain moment utile, jamais un blocage au login.
// ────────────────────────────────────────────────────────────────────────────

import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db'
import { contractAcceptances } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { CGU_VERSION, PRESTATION_VERSION } from '@/lib/constants'

export type ContractDocumentType = 'cgu' | 'contract'

// Enregistre une acceptation (interne — appelée à l'inscription, à la
// publication, au retrait). Ne remplace jamais l'historique.
export async function recordAcceptance(
  userId: string,
  documentType: ContractDocumentType,
  version: string,
): Promise<void> {
  await db.insert(contractAcceptances).values({ userId, documentType, version })
}

// État d'acceptation de l'organisateur connecté (documents à jour ?).
export type ContractStatus = {
  cguVersion: string
  prestationVersion: string
  cguAccepted: boolean
  prestationAccepted: boolean
  // Vrai si l'organisateur doit (re)accepter les règles de reversement avant
  // de publier / retirer.
  needsPrestationAcceptance: boolean
}

export async function getContractStatus(): Promise<
  { success: true; data: ContractStatus } | { success: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    const rows = await db
      .select({ documentType: contractAcceptances.documentType, version: contractAcceptances.version })
      .from(contractAcceptances)
      .where(eq(contractAcceptances.userId, user.id))

    const cguAccepted = rows.some((row) => row.documentType === 'cgu' && row.version === CGU_VERSION)
    const prestationAccepted = rows.some(
      (row) => row.documentType === 'contract' && row.version === PRESTATION_VERSION,
    )

    return {
      success: true,
      data: {
        cguVersion: CGU_VERSION,
        prestationVersion: PRESTATION_VERSION,
        cguAccepted,
        prestationAccepted,
        needsPrestationAcceptance: !prestationAccepted,
      },
    }
  } catch {
    return { success: false, error: 'Impossible de vérifier les acceptations.' }
  }
}

// Accepte explicitement les règles de reversement (version courante).
export async function acceptPrestationContract(): Promise<{ success: true } | { success: false; error: string }> {
  const user = await getCurrentUser()
  if (!user || user.role !== 'organizer') {
    return { success: false, error: 'Connexion requise.' }
  }

  try {
    // Idempotent : si la version courante est déjà acceptée, rien à faire.
    const [existing] = await db
      .select({ id: contractAcceptances.id })
      .from(contractAcceptances)
      .where(
        and(
          eq(contractAcceptances.userId, user.id),
          eq(contractAcceptances.documentType, 'contract'),
          eq(contractAcceptances.version, PRESTATION_VERSION),
        ),
      )
      .limit(1)
    if (!existing) {
      await recordAcceptance(user.id, 'contract', PRESTATION_VERSION)
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Impossible d’enregistrer votre acceptation.' }
  }
}

// Vérifie que l'organisateur connecté a accepté la version courante des
// règles de reversement (utilisé par `publishEvent` — défense serveur).
export async function hasAcceptedPrestation(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: contractAcceptances.id })
    .from(contractAcceptances)
    .where(
      and(
        eq(contractAcceptances.userId, userId),
        eq(contractAcceptances.documentType, 'contract'),
        eq(contractAcceptances.version, PRESTATION_VERSION),
      ),
    )
    .limit(1)
  return Boolean(row)
}

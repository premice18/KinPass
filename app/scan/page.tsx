// ────────────────────────────────────────────────────────────────────────────
// Espace agent — `/scan` (Phase 7.2, route AGENT uniquement — le middleware
// redirige tout autre rôle vers son espace).
//
// Accueil du scanneur : événements qui lui sont assignés (AgentHome). La page
// est rendue côté serveur : l'accès agent est déjà garanti par `authorized`.
// ────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { AgentHome } from '@/components/features/scanner/AgentHome'
import { getCurrentUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Contrôle d’accès — kinPass',
  robots: 'noindex, nofollow',
}

export default async function ScanPage() {
  // Double protection (le middleware le fait déjà, on vérifie aussi ici).
  const user = await getCurrentUser()
  if (!user || user.role !== 'agent') redirect('/')

  return <AgentHome />
}

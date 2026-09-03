import { KinPassApp } from '@/components/KinPassApp'

// Point d'entrée : rend la coquille SPA. Le paramètre `?view=dashboard`
// (posé après connexion/inscription) choisit la vue initiale.
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const { view } = await searchParams
  return <KinPassApp initialView={view === 'dashboard' ? 'dashboard' : 'home'} />
}

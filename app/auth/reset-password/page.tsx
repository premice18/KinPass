import type { Metadata } from 'next'

import { ResetPasswordForm } from '@/components/features/auth/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe — kinPass',
  robots: 'noindex, nofollow',
}

// Page de réinitialisation (Phase 11.5) — le token arrive par l'URL, fourni
// au formulaire client ; l'action serveur le valide (hash, expiration, usage).
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token ?? ''} />
}

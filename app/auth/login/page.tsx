import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth'
import { LoginForm } from '@/components/features/auth/LoginForm'

// Page de connexion organisateur (publique).
// Un utilisateur déjà connecté est redirigé vers son dashboard.
export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) redirect('/?view=dashboard')

  return <LoginForm />
}

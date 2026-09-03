import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth'
import { RegisterForm } from '@/components/features/auth/RegisterForm'

// Page d'inscription organisateur (publique).
// Un utilisateur déjà connecté est redirigé vers son dashboard.
export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) redirect('/?view=dashboard')

  return <RegisterForm />
}

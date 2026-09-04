import { NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth'

// ────────────────────────────────────────────────────────────────────────────
// Route API — session courante (GET /api/auth/me).
//
// Le client (coquille SPA) interroge cette route pour savoir si un
// utilisateur est connecté (cookie httpOnly illisible en JS).
// ────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      // Avatar (photo Google ou URL) — affiché dans le header.
      avatarUrl: user.avatarUrl,
    },
  })
}

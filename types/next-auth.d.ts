// ────────────────────────────────────────────────────────────────────────────
// Augmentation des types Auth.js (v5).
//
// Ajoute `id` et `role` à l'utilisateur de session, et `role` au User renvoyé
// par le provider credentials (notre utilisateur en base).
// ────────────────────────────────────────────────────────────────────────────

import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession['user']
  }

  interface User {
    // Rôle kinPass de l'utilisateur (organizer, agent, superadmin).
    role?: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    // Identifiant kinPass (uuid en base) et rôle, injectés au login.
    id?: string
    role?: string
  }
}

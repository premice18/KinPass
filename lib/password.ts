// ────────────────────────────────────────────────────────────────────────────
// Hash des mots de passe — bcryptjs (pur JS, aucune compilation native).
//
// Utilisé par le provider `credentials` (Auth.js, cf. auth.ts) et par la
// Server Action d'inscription (lib/actions/auth.ts).
// ────────────────────────────────────────────────────────────────────────────

import bcrypt from 'bcryptjs'

// Hash d'un mot de passe (bcrypt, coût 10 par défaut).
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

// Compare un mot de passe en clair avec son hash.
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

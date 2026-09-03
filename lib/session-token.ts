// ────────────────────────────────────────────────────────────────────────────
// Session JWT — module léger compatible Edge (proxy/middleware).
//
// Contient uniquement ce qui touche au jeton (signature, vérification) avec
// `jose`, SANS base de données ni `server-only` : il peut être importé par le
// proxy Next (runtime Edge) comme par le serveur (`lib/auth.ts`).
// ────────────────────────────────────────────────────────────────────────────

import { SignJWT, jwtVerify } from 'jose'

// Nom du cookie de session (jamais accessible en JS : httpOnly).
export const SESSION_COOKIE = 'kinpass_session'

// Durée de vie de la session (7 jours).
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

// Récupère la clé de signature. Absente => erreur explicite au démarrage.
function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET
  if (!secret) {
    throw new Error('AUTH_SECRET est manquante. Ajoutez-la dans .env.local.')
  }
  return new TextEncoder().encode(secret)
}

// Crée un JWT de session signé pour un utilisateur.
export async function createSessionToken(user: { id: string; role: string }): Promise<string> {
  return new SignJWT({ role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret())
}

// Vérifie un JWT de session. Retourne `{ userId, role }` ou `null`.
export async function verifySessionToken(
  token: string,
): Promise<{ userId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub) return null
    return { userId: payload.sub, role: String(payload.role ?? '') }
  } catch {
    return null
  }
}

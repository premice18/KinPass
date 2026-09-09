// ────────────────────────────────────────────────────────────────────────────
// Rate limiting en mémoire (Phase 8 — robustesse).
//
// Limiteur fenêtre glissante simple, partagé par le processus : utilisé sur
// la CONNEXION pour ralentir le brute-force (comptes agents aux emails
// prévisibles notamment). Limite connue : sur un déploiement serverless
// multi-instances, chaque instance compte ses propres tentatives — un
// verrouillage côté base (table `login_attempts`) pourra durcir ensuite.
// ────────────────────────────────────────────────────────────────────────────

// Fenêtres conservées (email, IP si dispo…). Nettoyage paresseux.
const attempts = new Map<string, { count: number; resetAt: number }>()

// Vérifie si une clé a dépassé le seuil sur la fenêtre (sans consommer).
export function isRateLimited(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry) return false
  if (now > entry.resetAt) {
    attempts.delete(key)
    return false
  }
  return entry.count >= maxAttempts
}

// Enregistre une tentative (échec) pour une clé.
export function recordAttempt(key: string, windowMs: number): void {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    return
  }
  entry.count += 1
}

// Efface les tentatives d'une clé (connexion réussie).
export function clearAttempts(key: string): void {
  attempts.delete(key)
}

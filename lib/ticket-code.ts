// ────────────────────────────────────────────────────────────────────────────
// Codes de billet (Phase 6.2) — code alphanumérique unique de 6 caractères.
//
// Format canonique affiché : `XXX-XXX` (ex. `A4B-8K9`, `K9M-4X2`) — un tiret
// de lecture tous les 3 caractères. Le scanner ignore les tirets et force les
// majuscules : la comparaison en base se fait donc sur la forme canonique.
//
// Alphabet sans ambiguïté : les caractères visuellement confondables (0/O,
// 1/I) sont exclus — un code dicté par téléphone ne prête pas à confusion.
// ────────────────────────────────────────────────────────────────────────────

// Alphabet : 32 caractères (2^5) — minuscules exclues, ambiguïtés exclues.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Générateur aléatoire crypto (node:crypto global ou Web Crypto).
function secureRandomInt(max: number): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] % max
}

// Génère un code brut de 6 caractères (sans tiret).
function generateRawCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) code += ALPHABET[secureRandomInt(ALPHABET.length)]
  return code
}

// Génère un code de billet au format canonique `XXX-XXX`.
export function generateTicketCode(): string {
  const raw = generateRawCode()
  return `${raw.slice(0, 3)}-${raw.slice(3, 6)}`
}

// Normalise une saisie de code (scan manuel) : majuscules, tirets et espaces
// ignorés, pour une comparaison fiable avec la forme canonique en base.
export function normalizeTicketCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
  // Saisie partielle : reformate en `XXX-XXX` dès qu'on a 3 caractères.
  return raw.length > 3 ? `${raw.slice(0, 3)}-${raw.slice(3, 6)}` : raw
}

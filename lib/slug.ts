// Utilitaires de génération de slug pour les URLs publiques des événements
// (route future `/e/[slug]`).

// Normalise un texte français (accents, cédilles, apostrophes, espaces…) en un
// slug URL-safe : minuscules, tirets, caractères [a-z0-9-] uniquement.
export function slugify(input: string): string {
  const slug = input
    .normalize('NFD') // décompose les caractères accentués (é -> e + diacritique)
    .replace(/[\u0300-\u036f]/g, '') // supprime les diacritiques
    .toLowerCase()
    .replace(/['’]/g, '') // retire les apostrophes (droites et courbes)
    .replace(/[^a-z0-9]+/g, '-') // tout autre caractère devient un tiret
    .replace(/^-+|-+$/g, '') // nettoie les tirets en début / fin
    .slice(0, 200) // limite de sécurité (colonne slug varchar(255))

  // Le titre peut ne contenir que des caractères spéciaux : on retombe sur un
  // slug générique, complété ensuite par un suffixe aléatoire si besoin.
  return slug || 'evenement'
}

// Génère un suffixe aléatoire court (base36) pour garantir l'unicité d'un slug.
export function randomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

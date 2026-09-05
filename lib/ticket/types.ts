// ────────────────────────────────────────────────────────────────────────────
// Types du « moteur de billet » (Phase 6.3).
//
// Un billet est décrit par des données 100 % sérialisables (pas d'objets DB) :
// les mêmes champs alimentent le PDF serveur, l'aperçu écran et, plus tard,
// les exports PNG/JPG. Aucune dépendance — ce module est importable partout
// (serveur, scripts, composants).
// ────────────────────────────────────────────────────────────────────────────

// Données nécessaires au rendu d'un billet.
export type TicketArtwork = {
  // Code de 6 caractères au format canonique `XXX-XXX`.
  code: string
  eventTitle: string
  // Libellé prêt à l'affichage (ex. « samedi 20 septembre 2026 à 18:00 »).
  eventDateLabel?: string
  // Lieu (ex. « Galerie d'art moderne · Kinshasa, Gombe »).
  venue?: string
  ticketTypeName: string
  buyerName: string
  // Valeur encodée dans le QR (le code par défaut — réutilisé par le scan).
  qrValue?: string
  // Référence de commande lisible (accusé).
  orderReference?: string
}

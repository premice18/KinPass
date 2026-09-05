// ────────────────────────────────────────────────────────────────────────────
// QR code serveur (Phase 6.3) — `qrcode` (node-qrcode).
//
// Produit un QR en PNG (dataURL) pour l'impression PDF du billet. Pas de JSX
// ni d'import applicatif : module exécutable aussi bien par Next.js que par
// un script Node isolé (scripts/preview-ticket.mts).
// ────────────────────────────────────────────────────────────────────────────

import QRCode from 'qrcode'

// Génère un QR PNG (dataURL base64) pour la valeur donnée.
// `qrValue` est le code du billet par défaut — le scan lit donc le code 6
// caractères et le valide en base (index UNIQUE), y compris hors ligne.
export async function qrPngDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 1,
    // Correction M : tolère ~15 % d'altération (billet plié, reflets).
    errorCorrectionLevel: 'M',
  })
}

// ────────────────────────────────────────────────────────────────────────────
// Opérateurs Mobile Money RD Congo — sélectionnables au checkout (Phase 6.4).
//
// Module public (aucun secret) : les codes `provider` correspondent au
// catalogue KPay (`VODACOM_MPESA_COD`, `ORANGE_COD`, `AIRTEL_COD` — pays COD,
// devises CDF/USD). Importable côté client pour l'affichage du choix.
// ────────────────────────────────────────────────────────────────────────────

export type KpayCodProviderId = 'mpesa' | 'orange' | 'airtel'

export interface KpayCodProvider {
  id: KpayCodProviderId
  label: string
  shortLabel: string
  // Code exact attendu par l'API KPay (`provider` de payments/init).
  provider: 'VODACOM_MPESA_COD' | 'ORANGE_COD' | 'AIRTEL_COD'
}

// Liste blanche : seuls ces opérateurs sont acceptés au checkout (RDC).
export const KPAY_COD_PROVIDERS: KpayCodProvider[] = [
  { id: 'mpesa', label: 'M-Pesa (Vodacom)', shortLabel: 'M-Pesa', provider: 'VODACOM_MPESA_COD' },
  { id: 'orange', label: 'Orange Money', shortLabel: 'Orange Money', provider: 'ORANGE_COD' },
  { id: 'airtel', label: 'Airtel Money', shortLabel: 'Airtel Money', provider: 'AIRTEL_COD' },
]

// Retrouve un provider par son code KPay (webhook/statuts).
export function providerByCode(code: string): KpayCodProvider | undefined {
  return KPAY_COD_PROVIDERS.find((p) => p.provider === code)
}

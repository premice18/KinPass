// Constantes partagées de l'application kinPass.

// ────────────────────────────────────────────────────────────────────────────
// Organisateur de test (TEMPORAIRE)
//
// La Phase 4 (authentification) n'étant pas encore implémentée, les Server
// Actions de gestion d'événements utilisent cet identifiant fixe. Il sera
// remplacé par l'identifiant de l'utilisateur connecté (session) dès que
// l'authentification sera en place.
//
// Le script `scripts/seed-demo.ts` crée cet utilisateur en base (insert
// idempotent avec `ON CONFLICT DO NOTHING`).
// ────────────────────────────────────────────────────────────────────────────
export const DEFAULT_ORGANIZER_ID = '00000000-0000-4000-8000-000000000001'

// Liste des catégories d'événements proposées dans le formulaire.
// « Autre » ouvre un champ libre (`category_custom`) pour saisir un type
// personnalisé (cohérent avec le modèle de données `events.category`).
export const EVENT_CATEGORIES = ['Concert', 'Conférence', 'Festival', 'Soirée privée', 'Autre'] as const
export type EventCategory = (typeof EVENT_CATEGORIES)[number]

// Devises acceptées pour les types de billets.
export const TICKET_CURRENCIES = ['USD', 'CDF'] as const
export type TicketCurrency = (typeof TICKET_CURRENCIES)[number]

// Statuts de cycle de vie d'un événement.
export const EVENT_STATUSES = ['draft', 'published', 'finished'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

// ────────────────────────────────────────────────────────────────────────────
// Monétisation (Phase 10/11.2) — commission kinPass.
//
// 2 % prélevés côté ORGANISATEUR au retrait (l'acheteur paie exactement le
// prix affiché — aucun frais acheteur). La commission est retenue dans le
// wallet kinPass ; après les frais KPay (5 % dépôt + 5 % retrait), la marge
// nette réelle de kinPass ≈ 1,8 % du prix du billet.
// Surchargeable par variable d'environnement puis, à terme, par
// `app_settings` depuis le superadmin (Phase 16).
// ────────────────────────────────────────────────────────────────────────────
export const KINPASS_FEE_PERCENT = Number(process.env.KINPASS_FEE_PERCENT ?? '2')

// Versions des documents légaux (Phase 11.2) — à incrémenter à chaque
// évolution ; toute nouvelle version impose une re-acceptation (au prochain
// retrait/publication, jamais un blocage au login).
export const CGU_VERSION = '1.0'
// 1.1 : commission portée de 0,3 % à 2 % (l'acheteur ne paie rien de plus).
export const PRESTATION_VERSION = '1.1'

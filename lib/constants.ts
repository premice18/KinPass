// Constantes partagées de l'application Kin Pass.

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

// Liste fermée des catégories d'événements proposées dans le formulaire
// (cohérente avec le modèle de données `events.category`).
export const EVENT_CATEGORIES = ['Concert', 'Conférence', 'Mariage', 'Soirée privée'] as const
export type EventCategory = (typeof EVENT_CATEGORIES)[number]

// Devises acceptées pour les types de billets.
export const TICKET_CURRENCIES = ['USD', 'CDF'] as const
export type TicketCurrency = (typeof TICKET_CURRENCIES)[number]

// Statuts de cycle de vie d'un événement.
export const EVENT_STATUSES = ['draft', 'published', 'finished'] as const
export type EventStatus = (typeof EVENT_STATUSES)[number]

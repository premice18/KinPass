# Kin Pass

**Plateforme SaaS de billetterie et de contrôle d'accès pour les événements en RDC (Kinshasa).**

Kin Pass digitalise l'ensemble du cycle de vie d'un événement : création et vente de billets sécurisés, paiement via Mobile Money (M-Pesa, Orange Money, Airtel Money) et contrôle d'accès à la porte (scan QR + code alphanumérique de secours à 6 caractères).

> **Statut actuel** : gestion des événements fonctionnelle de bout en bout (création, édition, publication, suppression, KPIs sur données réelles) — sans authentification pour le moment (organisateur de test). Voir [`project_info.md`](./project_info.md) pour le détail.

## Statut du développement

| Module | Statut |
|---|---|
| Landing page | ✅ Fait (maquette) |
| Dashboard organisateur | ✅ Fait (données réelles, KPIs + actions Publier/Éditer/Supprimer) |
| Création / édition d'événement | ✅ Fait (persistance en base, multi-types de billets, slug unique) |
| Tunnel d'achat / billetterie | 🚧 En cours (UI, paiement factice) |
| Contrôle d'accès (scanner) | 🚧 En cours (saisie manuelle, scan caméra absent) |
| Base de données (Neon + Drizzle) | ✅ Fait (schéma + tables créées) |
| Tests end-to-end (Playwright) | ✅ Fait (landing, dashboard, événements, checkout, scanner) |
| Authentification | ❌ À venir |
| Paiement Mobile Money | ❌ À venir |

## Stack technique

- **Framework** : Next.js 16 (App Router), React 19
- **Style** : Tailwind CSS v4 + shadcn/ui (`base-nova`)
- **Icônes** : `iconoir-react`
- **Base de données** : Neon PostgreSQL + `drizzle-orm` + `postgres` (postgres.js)
- **Thème** : `next-themes` (clair/sombre)
- **Analytics** : `@vercel/analytics`
- **Gestionnaire de paquets** : pnpm

## Prérequis

- Node.js 20+
- pnpm (via Corepack)
- Un compte [Neon](https://neon.tech) (PostgreSQL)

## Installation

```bash
pnpm install
cp .env.local.example .env.local   # puis renseigner DATABASE_URL
pnpm db:push                        # crée les tables
node scripts/seed-demo.mts          # organisateur de test + données de démo (optionnel)
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL de connexion Neon (poolée), ex. `postgresql://...` |

## Commandes disponibles

```bash
pnpm dev          # serveur de développement
pnpm build        # build de production
pnpm start        # démarrage production
pnpm typecheck    # vérification TypeScript
pnpm db:push      # pousse le schéma vers la base
pnpm db:generate  # génère les migrations SQL
pnpm db:studio    # ouvre Drizzle Studio
pnpm test:e2e     # tests end-to-end Playwright (démarre le serveur automatiquement)
node scripts/seed-demo.mts   # seed données de démo (--reset pour repartir de zéro)
```

## Tests

Les tests end-to-end utilisent **Playwright** et sont exécutés dans Chromium
contre une base de démonstration réinitialisée avant chaque lancement.

```bash
corepack pnpm exec playwright install chromium   # une seule fois
pnpm test:e2e                                    # lance la suite complète
pnpm test:e2e:headed                             # navigateur visible
pnpm test:e2e:ui                                 # mode interactif
```

Le détail (conventions, `data-testid`, comment ajouter un test) est documenté
dans [`tests/README.md`](./tests/README.md).

## Structure du projet

```
app/                   # Routes App Router (page + layout)
components/
  KinPassApp.tsx       # Coquille SPA — navigation par état
  layout/              # Composants de coquille (Logo, ThemeToggle)
  ui/                  # Primitives atomiques (button, card, input, badge, tabs)
  features/            # Vues par domaine (1 dossier = 1 future route)
    landing/           # LandingPage
    dashboard/         # OrganizerDashboard
    event-creation/    # EventCreationForm
    checkout/          # TicketCheckout
    scanner/           # Scanner
lib/
  actions/events.ts    # Server Actions CRUD événements (+ stats agrégées)
  validators/events.ts # Schémas Zod (messages en français)
  constants.ts         # Organisateur de test + catégories / devises / statuts
  slug.ts              # Génération de slug URL unique
  db/schema.ts         # Schéma Drizzle (users, events, ticket_types, tickets, scans)
  db/index.ts          # Client Drizzle
  utils.ts             # cn()
scripts/
  seed-demo.mts        # Seed organisateur de test + données de démo
tests/
  e2e/                 # Tests Playwright (landing, dashboard, événements, checkout, scanner)
playwright.config.ts   # Configuration Playwright
drizzle.config.ts
```

## Fonctionnalités disponibles

- Landing page marketing
- **Dashboard organisateur branché sur les données réelles** : KPIs (revenus USD/CDF, billets vendus, taux de remplissage, personnes entrées), liste des événements avec statut et progression des ventes
- **Création / édition d'événement persistée** : informations générales, multi-types de billets (prix, devise USD/CDF, capacité), slug unique généré depuis le titre, validation Zod (français) côté serveur et client
- **Publication / suppression d'événement** (avec confirmation)
- Tunnel de réservation (quantité, coordonnées, bouton Mobile Money factice)
- Scanner (saisie manuelle + retours VERT / ORANGE / ROUGE)
- Thème clair / sombre (toggle header)
- Menu mobile responsive

> **Note** : sans authentification pour l'instant, les événements sont créés sous un organisateur de test fixe (`lib/constants.ts`), remplacé par la session utilisateur dès la Phase 4 (auth).

## Prochaines étapes

1. Authentification organisateur (email + bcrypt, sessions) et sécurisation des Server Actions.
2. Routing par URL (`/dashboard`, `/events/new`, `/e/[slug]`).
3. Billetterie publique : page événement, génération code 6 caractères + QR + paiement Mobile Money.
4. Scanner caméra + code PIN agent + validation en base (< 500 ms).
5. Upload de l'affiche (Supabase Storage / Vercel Blob) — actuellement champ URL.

## Liens utiles

- Déploiement : automatique via Vercel (projet v0) — [v0](https://v0.app/chat/projects/prj_EIIwaVB6XL6xJR04qDMRTJk43sJz)

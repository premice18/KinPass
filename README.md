# Kin Pass

**Plateforme SaaS de billetterie et de contrôle d'accès pour les événements en RDC (Kinshasa).**

Kin Pass digitalise l'ensemble du cycle de vie d'un événement : création et vente de billets sécurisés, paiement via Mobile Money (M-Pesa, Orange Money, Airtel Money) et contrôle d'accès à la porte (scan QR + code alphanumérique de secours à 6 caractères).

> **Statut actuel** : prototype front-end (UI) + fondations base de données posées. La logique métier (auth, API, paiement, scanner) reste à implémenter. Voir [`project_info.md`](./project_info.md) pour le détail.

## Statut du développement

| Module | Statut |
|---|---|
| Landing page | ✅ Fait (maquette) |
| Dashboard organisateur | ✅ Fait (maquette, données factices) |
| Création d'événement | 🚧 En cours (formulaire UI, sans persistance) |
| Tunnel d'achat / billetterie | 🚧 En cours (UI, paiement factice) |
| Contrôle d'accès (scanner) | 🚧 En cours (saisie manuelle, scan caméra absent) |
| Base de données (Neon + Drizzle) | ✅ Fait (schéma + tables créées) |
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
```

## Structure du projet

```
app/                   # Routes App Router (page + layout)
components/
  Logo.tsx             # Logo « ticket premium »
  ThemeToggle.tsx      # Bascule clair/sombre
  KinPassApp.tsx       # Navigation par état (SPA)
  views/               # Landing, Dashboard, Création, Checkout, Scanner
  ui/                  # Composants shadcn/ui
lib/
  db/schema.ts         # Schéma Drizzle (users, events, ticket_types, tickets, scans)
  db/index.ts          # Client Drizzle
  utils.ts             # cn()
drizzle.config.ts
```

## Fonctionnalités disponibles (démo)

- Landing page marketing
- Dashboard organisateur (KPIs + liste d'événements factices)
- Formulaire de création d'événement (validation du titre)
- Tunnel de réservation (quantité, coordonnées, bouton Mobile Money factice)
- Scanner (saisie manuelle + retours VERT / ORANGE / ROUGE)
- Thème clair / sombre (toggle header)
- Menu mobile responsive

## Prochaines étapes

1. Authentification organisateur (email + bcrypt, sessions).
2. API/Server Actions + création d'événement persistée (multi-types de billets, upload affiche).
3. Routing par URL (`/e/[slug]`, `/scan/[slug]`, `/dashboard`).
4. Billetterie publique : génération code 6 caractères + QR + paiement Mobile Money.
5. Scanner caméra + code PIN agent + validation en base (< 500 ms).

## Liens utiles

- Déploiement : automatique via Vercel (projet v0) — [v0](https://v0.app/chat/projects/prj_EIIwaVB6XL6xJR04qDMRTJk43sJz)

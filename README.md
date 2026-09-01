# Kin Pass

---

![Next.js](https://img.shields.io/badge/Next.js-000000.svg?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A.svg?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4.svg?style=flat-square&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F.svg?style=flat-square&logoColor=black)
![Zod](https://img.shields.io/badge/Zod-3E67B1.svg?style=flat-square&logo=zod&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33.svg?style=flat-square&logo=playwright&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220.svg?style=flat-square&logo=pnpm&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000.svg?style=flat-square&logo=vercel&logoColor=white)

**Plateforme SaaS de billetterie et de contrôle d'accès pour les événements en République démocratique du Congo.**

Kin Pass digitalise l'ensemble du cycle de vie d'un événement : création de l'événement, vente de billets numériques sécurisés, paiement via Mobile Money (M-Pesa, Orange Money, Airtel Money) et contrôle d'accès à la porte (scan de QR code + code alphanumérique de secours à 6 caractères).

---

## À propos

Kin Pass répond à un besoin concret du marché congolais : la plupart des événements (concerts, conférences, mariages, soirées privées) sont encore gérés avec des billets papier, des listes Excel et des encaissements manuels. Kin Pass remplace tout cela par une plateforme unique et simple, adaptée aux moyens de paiement locaux.

Trois profils utilisent la plateforme :

| Rôle                  | Description                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organisateur**      | Crée et configure ses événements, fixe les tarifs, suit les ventes en temps réel, récupère ses revenus et exporte la liste des participants. |
| **Acheteur**          | Découvre l'événement via un lien, réserve, paie en Mobile Money et reçoit son billet numérique (QR code + code de secours à 6 caractères).   |
| **Agent de contrôle** | Valide l'entrée à la porte en scannant le QR code ou en saisissant le code de secours, via une interface dédiée protégée par un code PIN.    |

## Statut du développement

| Module                           | Statut                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| Landing page                     | Terminé                                                             |
| Dashboard organisateur           | Terminé (données réelles : KPIs, publication, édition, suppression) |
| Création / édition d'événement   | Terminé (persistance en base, multi-types de billets, slug unique)  |
| Base de données (Neon + Drizzle) | Terminé                                                             |
| Tests end-to-end (Playwright)    | Terminé (15 scénarios)                                              |
| Tunnel d'achat / billetterie     | En cours (interface, paiement factice)                              |
| Contrôle d'accès (scanner)       | En cours (saisie manuelle, scan caméra absent)                      |
| Authentification                 | À venir                                                             |
| Paiement Mobile Money            | À venir                                                             |
| Monétisation & reversement       | À venir                                                             |

> **Note** : l'authentification n'étant pas encore implémentée, les événements sont pour l'instant créés sous un organisateur de test fixe (`lib/constants.ts`). Ce mécanisme temporaire sera remplacé par la session utilisateur dès la phase d'authentification.

## Direction visuelle

Le design s'appuie sur l'univers du **billet** (talons, perforations pointillées, codes, chiffres tabulaires), avec l'accent **cyan** de la charte. L'objectif est un rendu original et premium, éloigné des gabarits génériques. Le détail de la charte (palette, typographie, langage visuel) est décrit dans [`project_info.md`](./project_info.md).

| Domaine         | Technologie                                                    | Rôle                                                  |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Framework       | **Next.js 16** (App Router), **React 19**                      | Rendu serveur, routing, composants                    |
| Langage         | **TypeScript 5.7** (mode strict)                               | Typage, sûreté du code                                |
| Style           | **Tailwind CSS v4** + **shadcn/ui** (`base-nova`)              | Design system, tokens sémantiques, thème clair/sombre |
| Icônes          | **iconoir-react**                                              | Icônes SVG cohérentes                                 |
| Base de données | **Neon** (PostgreSQL serverless)                               | Stockage des données                                  |
| ORM             | **Drizzle ORM** + **postgres** (postgres.js) + **drizzle-kit** | Requêtes typées, schéma, migrations                   |
| Validation      | **Zod 4**                                                      | Validation côté serveur (messages en français)        |
| Thème           | **next-themes**                                                | Bascule clair / sombre                                |
| Tests           | **Playwright** (`@playwright/test`)                            | Tests end-to-end                                      |
| Analytics       | **@vercel/analytics**                                          | Mesure d'audience                                     |
| Paquets         | **pnpm** (via Corepack)                                        | Gestionnaire de dépendances                           |

## Architecture

- **App Router** : le point d'entrée `app/page.tsx` rend `KinPassApp`, une coquille applicative (SPA) qui gère la navigation par état entre les vues. Le passage à un routing par URL (`/dashboard`, `/events/new`, `/e/[slug]`) est prévu.
- **Server Actions** (`lib/actions/`) : logique métier côté serveur (création, mise à jour, publication, suppression des événements, agrégation des statistiques) appelée directement depuis les composants client.
- **Couche de validation** (`lib/validators/`) : schémas Zod partagés, séparés des actions (contrainte `"use server"`).
- **Accès aux données** (`lib/db/`) : schéma Drizzle (5 tables : `users`, `events`, `ticket_types`, `tickets`, `scans`) et client singleton.
- **Composants** : primitives réutilisables dans `components/ui/`, composants de coquille dans `components/layout/`, vues métier dans `components/features/` (une par domaine).

## Prérequis

- **Node.js 20+** (Corepack inclus pour `pnpm`)
- Un compte **[Neon](https://neon.tech)** (base PostgreSQL serverless)

## Installation

```bash
pnpm install
cp .env.local.example .env.local   # renseigner DATABASE_URL
pnpm db:push                       # crée les tables en base
node scripts/seed-demo.mts         # données de démonstration (optionnel)
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

| Variable       | Description                                            |
| -------------- | ------------------------------------------------------ |
| `DATABASE_URL` | URL de connexion Neon (poolée), ex. `postgresql://...` |

## Commandes

```bash
pnpm dev            # serveur de développement
pnpm build          # build de production
pnpm start          # démarrage de la version de production
pnpm typecheck      # vérification TypeScript
pnpm db:push        # applique le schéma à la base
pnpm db:generate    # génère les migrations SQL
pnpm db:studio      # ouvre Drizzle Studio (explorateur de base)
pnpm test:e2e       # tests end-to-end Playwright (démarre le serveur automatiquement)
node scripts/seed-demo.mts --reset   # réinitialise les données de démonstration
```

## Tests

Les tests end-to-end utilisent **Playwright** (Chromium) et s'exécutent contre une base de démonstration réinitialisée avant chaque lancement. Ils couvrent la landing, le dashboard, la création/édition d'événements, le checkout et le scanner.

```bash
corepack pnpm exec playwright install chromium   # à exécuter une seule fois
pnpm test:e2e                                    # lance la suite complète
pnpm test:e2e:headed                             # navigateur visible
pnpm test:e2e:ui                                 # mode interactif
```

Le détail (conventions de nommage, `data-testid`, ajout de tests) est dans [`tests/README.md`](./tests/README.md).

## Structure du projet

```
app/                     # Routes App Router (page + layout + styles globaux)
components/
  KinPassApp.tsx         # Coquille SPA (navigation par état)
  layout/                # Composants de coquille (Logo, ThemeToggle)
  ui/                    # Primitives atomiques (button, card, input, badge, tabs)
  features/              # Vues métier, une par domaine
    landing/             #   LandingPage
    dashboard/           #   OrganizerDashboard
    event-creation/      #   EventCreationForm
    checkout/            #   TicketCheckout
    scanner/             #   Scanner
lib/
  actions/events.ts      # Server Actions (CRUD événements + statistiques)
  validators/events.ts   # Schémas Zod
  constants.ts           # Constantes (catégories, devises, statuts, organisateur de test)
  slug.ts                # Génération de slug URL unique
  db/schema.ts           # Schéma Drizzle (5 tables)
  db/index.ts            # Client Drizzle (singleton)
  utils.ts               # utilitaire cn()
scripts/
  seed-demo.mts          # Données de démonstration
tests/
  e2e/                   # Tests Playwright
playwright.config.ts     # Configuration Playwright
drizzle.config.ts        # Configuration drizzle-kit
```

## Fonctionnalités disponibles

- **Landing page** : présentation du produit, section fonctionnalités, footer.
- **Dashboard organisateur** : KPIs en temps réel (revenus USD/CDF, billets vendus, taux de remplissage, personnes entrées), liste des événements avec statut et progression des ventes, actions publier / éditer / supprimer.
- **Création / édition d'événement** : informations générales, multi-types de billets (prix, devise USD/CDF, capacité), slug unique généré depuis le titre, validation côté serveur et client.
- **Tunnel de réservation** (maquette) : sélection de quantité, coordonnées, paiement factice.
- **Scanner** (maquette) : saisie manuelle du code avec retours VERT / ORANGE / ROUGE.
- **Thème clair / sombre** et menu mobile responsive.

## Feuille de route

Le plan détaillé (avec spécifications par phase) est dans [`project_info.md`](./project_info.md). Les grandes étapes restantes :

1. **Authentification & compte organisateur** : inscription/connexion, profil (photo, WhatsApp, compte de reversement), sécurisation des Server Actions.
2. **Billetterie publique** : page événement, galerie de 1 à 3 photos, commandes, remise du billet (email ou téléchargement PDF/PNG/JPG), paiement Mobile Money et pages de confirmation.
3. **Scanner** : caméra QR, code PIN agent, validation en base.
4. **Vitrine publique** : événements publiés affichés sur la landing et sur une page de listing.
5. **Monétisation & reversement** : commission Kin Pass, retrait à la demande vers le compte de l'organisateur.
6. **Confiance & conformité** : conditions générales, politique de confidentialité, contrat de prestation.
7. **Vérification de billet publique** : page `/verify` pour vérifier et re-télécharger un billet.
8. **Export & reporting** : rapport PDF et export CSV des participants.

## Liens utiles

- Déploiement : automatique via Vercel — [v0](https://v0.app/chat/projects/prj_EIIwaVB6XL6xJR04qDMRTJk43sJz)

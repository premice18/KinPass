<h1 align="center">kinPass</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000.svg?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-20232A.svg?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4.svg?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1.svg?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle-C5F74F.svg?style=for-the-badge&logoColor=black" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Zod-3E67B1.svg?style=for-the-badge&logo=zod&logoColor=white" alt="Zod" />
  <img src="https://img.shields.io/badge/Playwright-2EAD33.svg?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/pnpm-F69220.svg?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/Vercel-000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

<p align="center"><strong>Plateforme SaaS de billetterie et de contrôle d'accès pour les événements en République démocratique du Congo.</strong></p>

kinPass digitalise l'ensemble du cycle de vie d'un événement : création de l'événement, vente de billets numériques sécurisés, paiement via Mobile Money (M-Pesa, Orange Money, Airtel Money) et contrôle d'accès à la porte (scan de QR code + code alphanumérique de secours à 6 caractères).

---

## À propos

kinPass répond à un besoin concret du marché congolais : la plupart des événements (concerts, conférences, festivals, soirées privées) sont encore gérés avec des billets papier, des listes Excel et des encaissements manuels. kinPass remplace tout cela par une plateforme unique et simple, adaptée aux moyens de paiement locaux.

Trois profils utilisent la plateforme :

| Rôle                  | Description                                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Organisateur**      | Crée et configure ses événements, fixe les tarifs, suit les ventes en temps réel, récupère ses revenus et exporte la liste des participants. |
| **Acheteur**          | Découvre l'événement via un lien, réserve, paie en Mobile Money et reçoit son billet numérique (QR code + code de secours à 6 caractères).   |
| **Agent de contrôle** | Valide l'entrée à la porte en scannant le QR code ou en saisissant le code de secours, via une interface dédiée protégée par un code PIN.    |

## Statut du développement

| Module                           | Statut                                                              |
| -------------------------------- | ------------------------------------------------------------------- |
| Landing page                     | Terminé (bandeau « Événements à venir » inclus)                     |
| Vitrine publique                 | Terminé (Phase 9 : listing Billetterie, filtres, recherche, tri, page organisateur /o/[slug]) |
| Dashboard organisateur           | Terminé (données réelles : KPIs, publication, édition, suppression) |
| Création / édition d'événement   | Terminé (persistance en base, multi-types de billets, galerie 1-3 photos, slug unique) |
| Page publique événement `/e/[slug]` | Terminé (Phase 6.1 : SEO dynamique, galerie carrousel, partage WhatsApp) |
| Base de données (Neon + Drizzle) | Terminé                                                             |
| Tests end-to-end (Playwright)    | Écrits (landing, dashboard, événements, page publique, vitrine, checkout, scanner) — exécution sur demande |
| Tunnel d'achat / billetterie     | En cours (6.2-6.4 : commandes, remise email/PDF, paiement KPay ou simulé, billets émis) |
| Contrôle d'accès (scanner)       | En cours (saisie manuelle, scan caméra absent)                      |
| Authentification                 | En cours (email/mot de passe + Google via Auth.js, profil à venir)  |
| Paiement Mobile Money            | En cours (6.4-6.5 : KPay COD + webhook, pages success/cancel, calendrier — validation clés de test à faire) |
| Monétisation & reversement       | À venir                                                             |

> **Note** : depuis la Phase 4.1, les Server Actions sont sécurisées par session. Un **compte de démonstration** est créé par le seed : `organisateur@kinpass.test` / `Demo@2026` (voir Installation).

## Direction visuelle

Le design s'appuie sur l'univers du **billet** (talons, perforations pointillées, codes, chiffres tabulaires), avec l'accent **cyan** de la charte. L'objectif est un rendu original et premium, éloigné des gabarits génériques. Le détail de la charte (palette, typographie, langage visuel) est décrit dans [`project_info.md`](./project_info.md).

L'interface intègre également :
- des **photos libres de droits (Pexels)** pour le fond du hero et les couvertures d'événements — la clé API reste côté serveur (proxy `/api/pexels`) ;
- des **animations Framer Motion** (apparitions au scroll, survols, transitions d'états), respectueuses de `prefers-reduced-motion` ;
- un **menu mobile en overlay** (panneau superposé + backdrop flouté) avec une **icône animée hamburger ⇄ flèche vers le haut** ;
- des **illustrations SVG de marque** (`public/illustrations/`) pour les états vides ;
- des **animations Lottie** (`public/lottie/`) pour le paiement, la confirmation d'achat et le scan valide.

| Domaine         | Technologie                                                    | Rôle                                                  |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| Framework       | **Next.js 16** (App Router), **React 19**                      | Rendu serveur, routing, composants                    |
| Langage         | **TypeScript 5.7** (mode strict)                               | Typage, sûreté du code                                |
| Style           | **Tailwind CSS v4** + **shadcn/ui** (`base-nova`)              | Design system, tokens sémantiques, thème clair/sombre |
| Icônes          | **iconoir-react**                                              | Icônes SVG cohérentes                                 |
| Animations      | **Framer Motion**                                              | Apparitions au scroll, micro-interactions, transitions |
| Feedback        | **lottie-react**                                               | Animations Lottie (paiement, succès, scan)            |
| Photos          | **Pexels API** (via proxy serveur)                             | Photos libres de droits (fonds, couvertures)          |
| Base de données | **Neon** (PostgreSQL serverless)                               | Stockage des données                                  |
| ORM             | **Drizzle ORM** + **postgres** (postgres.js) + **drizzle-kit** | Requêtes typées, schéma, migrations                   |
| Validation      | **Zod 4**                                                      | Validation côté serveur (messages en français)        |
| Authentification| **Auth.js v5** (`next-auth`) + **bcryptjs**                    | Sessions (JWT), providers email/mot de passe et Google |
| PDF billet      | **@react-pdf/renderer** + **qrcode** (node)                    | Billet PDF serveur + QR PNG (Phase 6.3) |
| Emails          | **Resend** (optionnel, chargé à la volée)                      | Remise des billets par email (sinon simulé en dev) |
| Thème           | **next-themes**                                                | Bascule clair / sombre                                |
| Tests           | **Playwright** (`@playwright/test`)                            | Tests end-to-end                                      |
| Analytics       | **@vercel/analytics**                                          | Mesure d'audience                                     |
| Paquets         | **pnpm** (via Corepack)                                        | Gestionnaire de dépendances                           |

## Architecture

- **App Router** : le point d'entrée `app/page.tsx` rend `KinPassApp`, une coquille applicative (SPA) qui gère la navigation par état entre les vues. Deux routes publiques sont de vraies URLs : **`/e/[slug]`** (page événement, Phase 6.1) et **`/o/[slug]`** (page organisateur, Phase 9.5) — métadonnées SEO dynamiques (`generateMetadata` : titre, description, `og:image` = affiche, canonical) puis rendu de la coquille (ou de la page autonome pour `/o`) avec les données injectées. Le passage des autres vues à un routing par URL (`/dashboard`, `/events`, `/e/[slug]/checkout`) est prévu.
- **Server Actions** (`lib/actions/`) : logique métier côté serveur (création, mise à jour, publication, suppression des événements — galerie comprise —, agrégation des statistiques, vitrine publique `getPublicEvents`, profil public organisateur) appelée directement depuis les composants client.
- **Couche de validation** (`lib/validators/`) : schémas Zod partagés, séparés des actions (contrainte `"use server"`).
- **Accès aux données** (`lib/db/`) : schéma Drizzle (tables : `users`, `payout_methods`, `events`, `event_images`, `ticket_types`, `tickets`, `scans`) et client singleton.
- **Composants** : primitives réutilisables dans `components/ui/`, composants de coquille dans `components/layout/`, vues métier dans `components/features/` (une par domaine).

## Prérequis

- **Node.js 20+** (Corepack inclus pour `pnpm`)
- Un compte **[Neon](https://neon.tech)** (base PostgreSQL serverless)

## Installation

```bash
pnpm install
cp .env.local.example .env.local   # renseigner DATABASE_URL + AUTH_SECRET
pnpm db:push                       # crée les tables en base
node scripts/seed-demo.mts         # données de démonstration (optionnel)
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000), puis créer un compte
via **Inscription** (`/auth/register`) ou utiliser le compte de démonstration :
`organisateur@kinpass.test` / `Demo@2026` (celui-ci possède les événements du seed).
La vitrine publique est visible sans connexion : bandeau de la landing, rubrique
« Billetterie », pages `/e/kin-house-open-studio`, `/e/expo-photo-gombe` et
`/o/organisateur-demo`.

## Variables d'environnement

| Variable       | Description                                            |
| -------------- | ------------------------------------------------------ |
| `DATABASE_URL` | URL de connexion Neon (poolée), ex. `postgresql://...` |
| `AUTH_SECRET`  | Clé de signature des sessions JWT (≥ 32 caractères). Générer : `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |
| `PEXELS_API_KEY` | Clé API [Pexels](https://www.pexels.com/api/) (optionnelle) — photos libres de droits pour les fonds et couvertures. Sans clé, les composants affichent des fallbacks de marque. |
| `NEXT_PUBLIC_APP_URL` | URL publique du site (partage WhatsApp + aperçus OG). Repli local : `http://localhost:3000` |
| `RESEND_API_KEY` | Clé [Resend](https://resend.com) (optionnelle) — remise des billets par email. Sans clé : envoi simulé (log) en développement ; installer `pnpm add resend` dès activation. |
| `MAIL_FROM` | Expéditeur des emails kinPass (défaut `kinPass <billets@kinpass.app>`) |
| `KPAY_API_KEY` / `KPAY_SECRET_KEY` | Clés [KPay](https://admin.kpay.site) (Phase 6.4) : test `kpay_test_…`/`sk_test_…`, live `kpay_live_…`/`sk_live_…`. Sans clés : mode « Simuler le paiement » |
| `KPAY_WEBHOOK_SECRET` | Secret du callback Webhook « Dépôts » KPay (vérification `X-KPAY-Signature`). Absent en dev : signature non vérifiée (avertissement) |
| `KPAY_USD_CDF_RATE` | Taux USD → CDF pour facturer en CDF (KPay COD sans devise). Défaut `2800` |

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
app/e/[slug]/            # Page publique événement (SEO, Phase 6.1)
app/e/[slug]/checkout/   # Tunnel d'achat (Phase 6.2-6.4)
app/o/[slug]/            # Page publique organisateur (Phase 9.5)
components/
  KinPassApp.tsx         # Coquille SPA (navigation par état)
  layout/                # Composants de coquille (Logo, ThemeToggle)
  ui/                    # Primitives atomiques (button, card, input, badge, tabs)
  features/              # Vues métier, une par domaine
    landing/             #   LandingPage
    dashboard/           #   OrganizerDashboard
    event-creation/      #   EventCreationForm
    event-public/        #   EventPublicView (galerie, partage)
    events/              #   EventCard « talon » + EventListing (vitrine Phase 9)
    checkout/            #   EventCheckout (tunnel /e/[slug]/checkout, Phase 6.2)
    scanner/             #   Scanner
lib/
  actions/events.ts      # Server Actions (CRUD + stats + galerie + pages publiques + vitrine)
  actions/orders.ts      # Commandes (createOrder, initiatePayment, statut)
  actions/organizers.ts  # Profil public organisateur (/o/[slug])
  ticket/                # Moteur de billet : types, QR PNG, PDF (Phase 6.3)
  kpay.ts                # Client KPay serveur (init USSD, signature webhook)
  kpay-providers.ts      # Opérateurs Mobile Money RDC (choix au checkout)
  payments.ts            # Exécution commande payée (billets, jauge, email)
  mail.ts                # Envoi email (Resend optionnel, simulé en dev)
  validators/events.ts   # Schémas Zod
  constants.ts           # Constantes (catégories, devises, statuts, organisateur de test)
  share.ts               # Helpers de partage (URL /e/[slug], texte WhatsApp)
  slug.ts                # Génération de slug URL unique
  ticket-code.ts         # Codes de billet 6 caractères (XXX-XXX)
  db/schema.ts           # Schéma Drizzle (users, payout_methods, events, event_images, ticket_types, orders, order_items, tickets, scans)
  db/user-slug.ts        # Slug public organisateur
  db/index.ts            # Client Drizzle (singleton)
  utils.ts               # utilitaire cn()
scripts/
  seed-demo.mts          # Données de démonstration (4 événements dont 3 publiés)
tests/
  e2e/                   # Tests Playwright
playwright.config.ts     # Configuration Playwright
drizzle.config.ts        # Configuration drizzle-kit
```

## Fonctionnalités disponibles

- **Landing page** : présentation du produit, section fonctionnalités, footer.
- **Dashboard organisateur** : KPIs en temps réel (revenus USD/CDF, billets vendus, taux de remplissage, personnes entrées), liste des événements avec statut et progression des ventes, actions publier / éditer / supprimer.
- **Création / édition d'événement** : informations générales, affiche (URL), **galerie de 1 à 3 photos** (URL, réordonnancement, suppression), multi-types de billets (prix, devise USD/CDF, capacité), slug unique généré depuis le titre, validation côté serveur et client.
- **Page publique d'événement** (`/e/[slug]`) : en-tête sombre, affiche + galerie en carrousel, description, tarifs, partage WhatsApp / copie du lien, métadonnées SEO dynamiques (og:image = affiche). Les brouillons et slugs inconnus renvoient une 404.
- **Vitrine publique (Phase 9)** : bandeau « Événements à venir » sur la landing ; rubrique « Billetterie » = listing complet (grille de cartes, filtres par catégorie, recherche par titre, tri par date, états chargement/erreur/vide) ; carte événement « talon » (pastille de date, prix réel « à partir de X $ », « Entrée libre »/« Complet » calculés) ; page publique organisateur `/o/[slug]` (avatar, bio, site, Instagram, événements publiés).
- **Tunnel d'achat** (`/e/[slug]/checkout`, Phase 6.2) : choix du type de billet avec jauge réelle (places restantes), quantité, opérateur Mobile Money (M-Pesa Vodacom / Orange Money / Airtel Money), coordonnées, remise — la commande est créée en base avec prix/capacité re-vérifiés côté serveur.
- **Paiement Mobile Money** (Phase 6.4) : intégration **KPay** (push USSD RD Congo, clés test `kpay_test_…`) + webhook sécurisé `/api/kpay/webhook` (signature HMAC, idempotent) → passage `paid`, **émission des billets** (QR + codes), envoi par email (PDF). **Sans clés KPay : mode « Simuler le paiement »** (démo/E2E). Conversion USD → CDF via `KPAY_USD_CDF_RATE` (KPay COD sans paramètre de devise).
- **Confirmation** (Phase 6.5) : pages `/e/[slug]/checkout/success` (récap commande payée, cartes billets QR + PDF/PNG/JPG, « Ajouter au calendrier » `.ics`, « Renvoyer par email ») et `/e/[slug]/checkout/cancel` (annulation + Réessayer).
- **Partage d'événement** (Phase 6.7) : panneau modal « Partager » (page publique + vue Détail) — URL canonique copiable, QR code, WhatsApp / Telegram / X / Facebook, partage natif du système quand disponible.
- **Scanner** (maquette) : saisie manuelle du code avec retours VERT / ORANGE / ROUGE.
- **Thème clair / sombre** et menu mobile responsive.

## Feuille de route

Le plan détaillé (avec spécifications par phase) est dans [`project_info.md`](./project_info.md). Les grandes étapes restantes :

1. **Authentification & compte organisateur** : inscription/connexion, profil (photo, WhatsApp, compte de reversement), sécurisation des Server Actions.
2. **Billetterie publique** : page événement, galerie, vitrine, tunnel d'achat, moteur PDF/QR et paiement KPay (webhook) faits — restent : pages de confirmation (6.5) avec boutons PNG/JPG + QR à l'écran, et la validation KPay avec clés de test.
3. **Scanner** : caméra QR, comptes scanneurs gérés par l'organisateur (accès restreint aux seuls événements assignés), validation en base.
4. **Vitrine publique (faite)** : événements publiés sur la landing et la rubrique « Billetterie » ; page publique organisateur `/o/[slug]` ; route `/events` SEO restante avec le routing par URL.
5. **Monétisation & reversement** : commission kinPass, retrait à la demande vers le compte de l'organisateur.
6. **Confiance & conformité** : conditions générales, politique de confidentialité, contrat de prestation.
7. **Vérification de billet publique** : page `/verify` pour vérifier et re-télécharger un billet.
8. **Export & reporting** : rapport PDF et export CSV des participants.
9. **Événements à entrée libre** : événements gratuits de bout en bout (commission 0, inscription sans paiement).
10. **Innovations différenciantes** : WhatsApp-first, QR dynamique anti-fraude, diaspora « je paie, un proche profite », paiement cash à l'entrée, affiliation des rabatteurs.

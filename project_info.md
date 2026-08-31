# PROJET KIN PASS – RÉFÉRENCE ULTRA-DÉTAILLÉE

**Ce document est le contrat unique et absolu pour l'agent IA.** Aucune décision UI/UX ou technique ne doit être prise sans se référer à ce qui est écrit ci-dessous.

---

## 0. RÈGLES D'EXÉCUTION POUR L'AGENT IA (NON NÉGOCIABLES)

1. **Lecture préalable** : Avant chaque modification de fichier, l'agent DOIT lire `project_info.md`.
2. **Aucun commit sans approbation** : L'agent ne doit **jamais** effectuer de `git commit`, `git push` ou `git merge` sans instruction explicite de l'utilisateur. Toute modification est présentée pour relecture avant commit.
3. **Commentaires en français** : Chaque fichier `.ts`, `.tsx` doit contenir des commentaires explicatifs en **français**. Les fonctions complexes, les hooks et les parties critiques (schéma DB, appels API, scanner) doivent être commentés.
4. **Mise à jour continue** : L'agent doit cocher les tâches de ce document au fur et à mesure de l'avancement (§4, §6).
5. **README** : Le fichier `README.md` doit être tenu à jour avec le §5.
6. **Icônes Iconoir, jamais d'émojis** : Tous les éléments graphiques (boutons, badges, indicateurs) utilisent des icônes SVG **Iconoir** (`iconoir-react`). **Aucun émoji** dans l'interface. Dimensionnées `h-4 w-4` à `h-6 w-6`, colorées via la charte (§1).

---

## 1. IDENTITÉ VISUELLE & CHARTE GRAPHIQUE (SAAS PREMIUM)

### 1.1 Palette de couleurs strictes

| Nom technique        | Hexadécimal | Usage                                                                   |
| :------------------- | :---------- | :---------------------------------------------------------------------- |
| **Electric Blue**    | `#2563EB`   | CTA primaires, liens, états actifs/surbrillance, dégradé du logo.       |
| **Flash Cyan**       | `#06B6D4`   | Accents, badges « mis en avant », dégradé du logo (2e stop), compteurs. |
| **Midnight Dark**    | `#0F172A`   | Texte des titres (H1/H2), fond du footer, fond du mode sombre.          |
| **Slate Background** | `#F8FAFC`   | Fond global des pages en mode clair.                                    |
| **Pure White**       | `#FFFFFF`   | Texte sur fond bleu/foncé, fond des cards et inputs.                    |
| **Success Green**    | `#10B981`   | État scanner **VALIDE**, boutons de confirmation.                       |
| **Warning Amber**    | `#F59E0B`   | État scanner **DÉJÀ SCANNÉ** (orange).                                  |
| **Danger Red**       | `#EF4444`   | État scanner **INVALIDE**, erreurs de formulaire, actions destructives. |

> 🎯 **Sémantique scanner (cœur produit)** : VERT = billet authentique non utilisé → `Success Green` ; ORANGE = billet déjà scanné → `Warning Amber` ; ROUGE = code inexistant/étranger à l'événement → `Danger Red`. Ces trois états sont portés par les couleurs ci-dessus et doublés d'un libellé textuel + icône (jamais la couleur seule).

### 1.2 Mode sombre / clair

- Basé sur `next-themes` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`).
- Le toggle est exposé dans le header (`components/layout/ThemeToggle.tsx`, icônes Iconoir `HalfMoon` / `SunLight`).
- Les tokens CSS sont définis dans `app/globals.css` (`:root` = clair, `.dark` = sombre, `@theme inline`). Ne jamais coder d'hex en dur dans les composants : utiliser les tokens sémantiques (`bg-background`, `text-foreground`, `text-primary`, `bg-destructive`, …).

### 1.3 Typographie & espacements

- **Police** : Système (`font-sans`). Aucune police personnalisée (performance).
- **Échelle** :
  - H1 : `text-5xl` (mobile) / `text-6xl` (desktop), `font-semibold tracking-tight`, couleur foreground.
  - H2 : `text-3xl` / `text-4xl`, `font-semibold tracking-tight`.
  - Corps : `text-lg` / `text-base`, `text-muted-foreground`.
  - Prix / chiffres clés : `text-3xl` à `text-5xl`, `font-semibold`, couleur `text-primary` ou cyan.
- **Bordure & rayon** : cartes, inputs et boutons en `rounded-xl` (12px). Avatars `rounded-full`.

### 1.4 Logo « ticket premium »

- Composant `components/layout/Logo.tsx` : billet SVG avec encoches latérales (perforation), dégradé `Electric Blue → Flash Cyan`, reflet supérieur, ligne de perforation verticale et coche blanche (validation d'accès).
- Taille pilotée par `className` (ex. `h-8 w-8` dans le header). Identifiants de dégradés uniques via `useId` (pas de collision si réutilisé).

---

## 2. SPÉCIFICATIONS DÉTAILLÉES PAR PAGE / MODULE

### Rôles utilisateurs

- **Organisateur** : crée/configure les événements, fixe les tarifs, suit les ventes, exporte les invités, génère des accès équipe.
- **Participant / Acheteur** : découvre l'événement via un lien, réserve, paie en Mobile Money, reçoit son billet numérique (QR + code 6 caractères).
- **Agent de contrôle** : accède à une interface dédiée (code PIN) pour scanner ou saisir les codes à la porte.

### 📄 Landing — Route `/`

**Objectif** : présenter le produit et orienter vers la création d'événement ou la démo de billetterie.

- Section héro 2 colonnes (badge « Billetterie sécurisée en RDC », H1, sous-titre, 2 CTA).
- Mockup de billet (carte sombre avec « KIN PASS », événement, type de billet, prix, QR).
- Section 3 fonctionnalités (Scan QR instantané / Code de secours / Mobile Money).
- Footer (copyright).
- **État** : ✅ fait (maquette).

### 📄 Authentification — Routes `/auth/login` et `/auth/register` (À VENIR)

- Email + mot de passe (bcrypt), formulaire login et register séparés.
- Validation (Zod) : email requis/format ; mot de passe min 8, une majuscule, une minuscule, un chiffre.
- Icônes Iconoir `Mail` / `Lock`.
- Comportement : `login` → session cookie → `/dashboard` ; `register` → création utilisateur (rôle `organizer`) → `/dashboard`.

### 📄 Tableau de bord organisateur — Route `/dashboard` (À VENIR, protégée)

- **KPIs temps réel** : chiffre d'affaires (USD/CDF), billets vendus, taux de remplissage, personnes entrées (scannées).
- **Liste des événements** : cartes avec statut (Brouillon / Publié / Terminé), progression des ventes, accès à la gestion.
- **État** : ✅ fait (`components/features/dashboard/OrganizerDashboard.tsx`, branché sur les données réelles via `getOrganizerEvents()` — KPIs agrégés en base, actions Publier/Éditer/Supprimer).

### 📄 Création d'événement — Route `/events/new` (À VENIR, protégée)

- Informations générales : titre, description, catégorie (Concert/Conférence/Mariage/Soirée privée).
- Localisation & date : lieu, date/heure début, date/heure fin.
- Visuel : upload de l'affiche (Supabase Storage / Vercel Blob) — **MVP : champ URL** (`poster_url`).
- **Paramétrage des billets** : plusieurs types (Standard/VIP/Invitation), prix, devise, capacité par type.
- Slug unique `/e/[slug]` généré depuis le titre.
- **État** : ✅ fait (`components/features/event-creation/EventCreationForm.tsx` — persistance réelle via Server Actions, multi-types de billets dynamiques, validation Zod + client, mode édition pré-rempli ; navigation par état SPA, la vraie route `/events/new` viendra avec le routing Phase 6).

### 📄 Page publique événement — Route `/e/[slug]` (À VENIR, publique)

- Affiche, description, tarifs, bouton d'achat. Lien partageable WhatsApp/réseaux.

### 📄 Tunnel d'achat & billetterie — Route `/e/[slug]/checkout` (À VENIR, publique)

- Sélection quantité + type de billet ; coordonnées acheteur (nom, téléphone Mobile Money, email optionnel).
- **Paiement Mobile Money** : M-Pesa / Orange Money / Airtel Money (agrégateur ou flux simulé pour MVP) + webhook de confirmation.
- **Billet numérique** : confirmation + envoi SMS/WhatsApp. Contenu : nom, type, événement, **QR Code dynamique** + **code alphanumérique unique de 6 caractères** (ex. `K9M-4X2`), affiché en gros.
- **État** : 🚧 maquette (`components/features/checkout/TicketCheckout.tsx` — prix codé en dur 38 $, paiement factice, code codé en dur `A4B-8K9`).

### 📄 Contrôle d'accès — Route `/scan/[slug]` (À VENIR)

- **Accès agent** : URL dédiée + **code PIN** fourni par l'organisateur.
- **Double interface** : (1) caméra QR ; (2) champ de saisie manuelle du code 6 caractères (majuscules auto, tirets ignorés).
- **Retours visuels + sonores** : VERT (valide, nom + type), ORANGE (déjà scanné, heure du 1er passage), ROUGE (invalide/étranger).
- **État** : 🚧 maquette (`components/features/scanner/Scanner.tsx` — saisie manuelle + normalisation + 3 états visuels, mais codes codés en dur `A4B8K9`/`X7PM3R`, pas de caméra, pas de PIN, pas de DB).

---

## 3. MODÈLE DE DONNÉES (POSTGRESQL / NEON — DRIZZLE)

Schéma défini dans `lib/db/schema.ts`, appliqué en base via `drizzle-kit push`.

### Table `users`

| Colonne                     | Type         | Contrainte            | Description            |
| :-------------------------- | :----------- | :-------------------- | :--------------------- |
| `id`                        | uuid         | PK, defaultRandom     | Identifiant            |
| `email`                     | varchar(255) | UNIQUE NOT NULL       | Connexion              |
| `password_hash`             | text         | NOT NULL              | Hash bcrypt            |
| `full_name`                 | varchar(255) | NOT NULL              | Nom complet            |
| `role`                      | varchar(20)  | default `'organizer'` | `organizer` \| `agent` |
| `created_at` / `updated_at` | timestamptz  | defaultNow            | Horodatage             |

### Table `events`

| Colonne               | Type         | Contrainte                   | Description                          |
| :-------------------- | :----------- | :--------------------------- | :----------------------------------- |
| `id`                  | uuid         | PK                           | Identifiant                          |
| `organizer_id`        | uuid         | FK `users` ON DELETE CASCADE | Organisateur                         |
| `title`               | varchar(255) | NOT NULL                     | Titre                                |
| `slug`                | varchar(255) | UNIQUE (index)               | URL `/e/[slug]`                      |
| `description`         | text         |                              | Description                          |
| `category`            | varchar(50)  |                              | Concert/Conférence/Mariage/Soirée    |
| `venue` / `location`  | varchar(255) |                              | Lieu                                 |
| `start_at` / `end_at` | timestamptz  |                              | Dates                                |
| `poster_url`          | text         |                              | Affiche                              |
| `status`              | varchar(20)  | default `'draft'`            | `draft` \| `published` \| `finished` |

### Table `ticket_types`

| Colonne      | Type          | Contrainte          | Description             |
| :----------- | :------------ | :------------------ | :---------------------- |
| `id`         | uuid          | PK                  | Identifiant             |
| `event_id`   | uuid          | FK `events` CASCADE | Événement               |
| `name`       | varchar(100)  | NOT NULL            | Standard/VIP/Invitation |
| `price`      | numeric(12,2) | default 0           | Prix                    |
| `currency`   | varchar(10)   | default `'USD'`     | `USD` \| `CDF`          |
| `capacity`   | integer       |                     | Capacité                |
| `sold_count` | integer       | default 0           | Vendus                  |

### Table `tickets`

| Colonne                       | Type         | Contrainte                | Description                                      |
| :---------------------------- | :----------- | :------------------------ | :----------------------------------------------- |
| `id`                          | uuid         | PK                        | Identifiant                                      |
| `event_id`                    | uuid         | FK `events` CASCADE       | Événement                                        |
| `ticket_type_id`              | uuid         | FK `ticket_types` CASCADE | Type de billet                                   |
| `buyer_name`                  | varchar(255) | NOT NULL                  | Acheteur                                         |
| `buyer_phone` / `buyer_email` | varchar      |                           | Contact                                          |
| `code`                        | varchar(10)  | **UNIQUE (index)**        | Code 6 caractères — objectif validation < 500 ms |
| `status`                      | varchar(20)  | default `'valid'`         | `valid` \| `used` \| `cancelled`                 |
| `scanned_at`                  | timestamptz  |                           | Premier scan                                     |

### Table `scans`

| Colonne      | Type        | Contrainte           | Description                    |
| :----------- | :---------- | :------------------- | :----------------------------- |
| `id`         | uuid        | PK                   | Identifiant                    |
| `ticket_id`  | uuid        | FK `tickets` CASCADE | Billet scanné                  |
| `event_id`   | uuid        | FK `events` CASCADE  | Événement                      |
| `agent_id`   | uuid        | FK `users` SET NULL  | Agent                          |
| `result`     | varchar(20) | NOT NULL             | `valid` \| `used` \| `invalid` |
| `scanned_at` | timestamptz | defaultNow           | Horodatage                     |

**Index de performance** : `tickets.code` (UNIQUE), `tickets.event_id`, `tickets.ticket_type_id`, `scans.ticket_id`, `scans.event_id`, `events.slug` (UNIQUE), `events.organizer_id`, `users.email`.

---

## 4. PLAN DE DÉVELOPPEMENT GRANULAIRE (CHECKLIST POUR L'IA)

### ✅ Phase 0 — Initialisation (FAITE)

- [x] Projet Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui (`base-nova`).
- [x] Composants UI atomiques : `button`, `card`, `input`, `badge`, `tabs`.
- [x] Passage des icônes de `lucide-react` vers **`iconoir-react`**.

### ✅ Phase 1 — Maquette UI / prototype (FAITE)

- [x] `components/KinPassApp.tsx` : navigation par état (SPA) entre les 5 vues.
- [x] `LandingPage` (landing + section fonctionnalités + footer).
- [x] `OrganizerDashboard` (KPIs + liste d'événements, données statiques).
- [x] `EventCreationForm` (formulaire, validation du titre).
- [x] `TicketCheckout` (sélection quantité, coordonnées, paiement factice, confirmation).
- [x] `Scanner` (saisie manuelle + normalisation + 3 états visuels).

### ✅ Phase 2 — Base de données (FAITE)

- [x] `drizzle-orm` + `postgres` (postgres.js) + `drizzle-kit`.
- [x] Schéma `lib/db/schema.ts` (users, events, ticket_types, tickets, scans + index).
- [x] Client `lib/db/index.ts` (singleton, SSL).
- [x] `drizzle.config.ts` + `.env.local` (`DATABASE_URL` Neon).
- [x] Tables créées en base (`pnpm db:push`).

### ✅ Phase 3 — Identité & thème (FAITE)

- [x] Logo « ticket premium » (`components/layout/Logo.tsx`).
- [x] Toggle clair/sombre (`next-themes` + `components/layout/ThemeToggle.tsx`).
- [x] Menu mobile responsive (hamburger + dropdown).

### ❌ Phase 4 — Authentification (À VENIR)

- [ ] `lib/auth.ts` : inscription/connexion, hash bcrypt, sessions (cookies).
- [ ] Routes `/auth/login` et `/auth/register`.
- [ ] Middleware/proxy protégeant `/dashboard`, `/events/*`, `/scan/*`.

### ✅ Phase 5 — Gestion des événements (FAITE — sans auth, organisateur de test)

- [x] Server Actions `lib/actions/events.ts` : créer/lire/éditer/publier/supprimer (persistance en base, transactions atomiques, slug unique, validation Zod en français, `organizer_id` fixe temporaire).
- [x] Formulaire `EventCreationForm` branché (multi-types de billets dynamiques, affiche par URL, validation client + serveur, mode édition) — navigation par état SPA en attendant le routing.
- [x] Dashboard `OrganizerDashboard` branché sur les données réelles (KPIs agrégés, progression des ventes, actions Publier/Éditer/Supprimer).
- [x] Données de démo : `scripts/seed-demo.mts` (organisateur de test + 2 événements, billets, scans ; option `--reset`).

### ❌ Phase 6 — Billetterie publique & paiement (À VENIR)

- [ ] Page publique `/e/[slug]`.
- [ ] Checkout branché : génération du code 6 caractères unique + QR (`qrcode.react`).
- [ ] Paiement Mobile Money (agrégateur KPAY ou flux simulé MVP) + webhook de confirmation.

### ❌ Phase 7 — Contrôle d'accès (À VENIR)

- [ ] Route `/scan/[slug]` + code PIN agent.
- [ ] Scan caméra (`html5-qrcode`) + validation en base (< 500 ms).
- [ ] États VERT/ORANGE/ROUGE branchés sur `tickets` + `scans` + retour sonore.

### ❌ Phase 8 — Polish & robustesse (À VENIR)

- [ ] Tests unitaires + E2E (Playwright).
- [ ] Sécurisation des routes (validation billets / modification événements).
- [ ] PWA (manifest + service worker) + export listes invités.

---

## 5. CONTENU OBLIGATOIRE DU FICHIER `README.md`

1. **Titre & description** — Kin Pass, billetterie et contrôle d'accès en RDC.
2. **Statut actuel** — modules faits / en cours / à venir.
3. **Stack technique** — réelle (Next.js 16, Tailwind v4, Drizzle, Neon, Iconoir).
4. **Prérequis** — Node.js 20+, pnpm, un compte Neon.
5. **Installation** — `pnpm install`, configuration `.env.local`.
6. **Variables d'environnement** — `DATABASE_URL`.
7. **Commandes** — `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm typecheck`, `pnpm db:push`, `pnpm db:studio`.
8. **Structure du projet** — arborescence simplifiée.
9. **Fonctionnalités disponibles** + **prochaines étapes**.
10. **Liens utiles** — déploiement Vercel.

---

## 6. STATUT ACTUEL DU PROJET

- **Phase 0** : ✅ TERMINÉE (init + UI kit + Iconoir).
- **Phase 1** : ✅ TERMINÉE (maquette UI des 5 vues).
- **Phase 2** : ✅ TERMINÉE (base Neon + schéma Drizzle appliqué).
- **Phase 3** : ✅ TERMINÉE (logo ticket, dark/light, menu mobile).
- **Phase 4 (auth)** : ❌ À VENIR.
- **Phase 5 (événements)** : ✅ TERMINÉE — CRUD complet + publication, organisateur de test fixe (`lib/constants.ts`), à sécuriser par la session dès la Phase 4.
- **Phase 6 (billetterie + paiement)** : ❌ À VENIR.
- **Phase 7 (scanner)** : ❌ À VENIR.
- **Phase 8 (polish)** : ❌ À VENIR.

**Avancement global estimé : ~40 %** (UI + fondations base de données + gestion des événements de bout en bout ; auth, billetterie publique et scanner restent à faire).

---

## 7. COMPOSANTS UI & STRUCTURE DU PROJET

```
app/
  page.tsx            # Point d'entrée -> KinPassApp
  layout.tsx          # Layout racine + ThemeProvider + métadonnées
  globals.css         # Tokens Tailwind v4 (clair/sombre)
components/
  KinPassApp.tsx      # Coquille SPA — navigation par état
  layout/             # Composants de coquille (header)
    Logo.tsx          # Logo « ticket premium »
    ThemeToggle.tsx   # Bascule clair/sombre
  ui/                 # Primitives atomiques (button, card, input, badge, tabs)
  features/           # Vues regroupées par domaine (1 dossier = 1 future route)
    landing/          # LandingPage
    dashboard/        # OrganizerDashboard
    event-creation/   # EventCreationForm
    checkout/         # TicketCheckout
    scanner/          # Scanner
lib/
  actions/events.ts   # Server Actions CRUD événements (+ stats agrégées)
  validators/events.ts# Schémas Zod (messages français) — séparés des actions
  constants.ts        # Organisateur de test temporaire + catégories/devises/statuts
  slug.ts             # slugify + suffixe aléatoire (slug URL unique)
  db/
    schema.ts         # Schéma Drizzle (5 tables)
    index.ts          # Client Drizzle (singleton)
  utils.ts            # cn()
scripts/
  seed-demo.mts       # Seed organisateur de test + données démo (--reset)
drizzle.config.ts     # Config drizzle-kit
.env.local            # DATABASE_URL (gitignoré)
```

---

## 8. VARIABLES D'ENVIRONNEMENT & COMMANDES

| Variable       | Obligatoire | Description                     |
| :------------- | :---------- | :------------------------------ |
| `DATABASE_URL` | ✅          | URL de connexion Neon (poolée). |

| Commande                    | Description                   |
| :-------------------------- | :---------------------------- |
| `pnpm dev`                  | Serveur de développement      |
| `pnpm build` / `pnpm start` | Build / démarrage production  |
| `pnpm typecheck`            | Vérification TypeScript       |
| `pnpm db:push`              | Pousse le schéma vers la base |
| `pnpm db:generate`          | Génère les migrations SQL     |
| `pnpm db:studio`            | Ouvre Drizzle Studio          |
| `node scripts/seed-demo.mts` | Seed organisateur de test + données démo (`--reset` pour repartir de zéro) |

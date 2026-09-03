# PROJET kinPass – RÉFÉRENCE ULTRA-DÉTAILLÉE

**Ce document est le contrat unique et absolu pour l'agent IA.** Aucune décision UI/UX ou technique ne doit être prise sans se référer à ce qui est écrit ci-dessous.

---

## 0. RÈGLES D'EXÉCUTION POUR L'AGENT IA (NON NÉGOCIABLES)

1. **Lecture préalable** : Avant chaque modification de fichier, l'agent DOIT lire `project_info.md`.
2. **Aucun commit sans approbation** : L'agent ne doit **jamais** effectuer de `git commit`, `git push` ou `git merge` sans instruction explicite de l'utilisateur. Toute modification est présentée pour relecture avant commit.
3. **Commentaires en français** : Chaque fichier `.ts`, `.tsx` doit contenir des commentaires explicatifs en **français**. Les fonctions complexes, les hooks et les parties critiques (schéma DB, appels API, scanner) doivent être commentés.
4. **Mise à jour continue** : L'agent doit cocher les tâches de ce document au fur et à mesure de l'avancement (§4, §6).
5. **README** : Le fichier `README.md` doit être tenu à jour avec le §5.
6. **Icônes Iconoir, jamais d'émojis** : Tous les éléments graphiques (boutons, badges, indicateurs) utilisent des icônes SVG **Iconoir** (`iconoir-react`). **Aucun émoji** dans l'interface. Dimensionnées `h-4 w-4` à `h-6 w-6`, colorées via la charte (§1).
7. **Tests E2E sur demande explicite uniquement (TRÈS IMPORTANT — économie de tokens)** : L'agent NE DOIT **JAMAIS** exécuter la suite Playwright (`pnpm test:e2e`) sans demande explicite de l'utilisateur. Les fichiers de tests sont créés / mis à jour **à chaque implémentation de fonctionnalité**, mais ils ne sont **jamais exécutés** sans accord explicite. Idéalement, l'exécution se fait à la **fin d'une phase entière** regroupant plusieurs fonctionnalités, et uniquement si l'utilisateur le demande. Pour vérifier le code, utiliser `pnpm typecheck` (rapide, non E2E) ; le build et les tests E2E ne se lancent que sur demande.

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

### 1.5 Langage visuel & signature (refonte « anti-générique »)

La direction visuelle est ancrée dans l'univers du **billet / talon** (cohérente avec le logo). Éléments clés, à conserver dans toute nouvelle UI :

- **Eyebrow** (`components/ui/eyebrow.tsx`) : étiquette de section « talon » = petite règle horizontale + texte en petites capitales espacées, colorée en cyan (`Flash Cyan`). Remplace les anciens badges-pilules arrondis teintés (cliché IA) et les libellés `text-primary`.
- **Badge** (`components/ui/badge.tsx`) : étiquette angulaire (`rounded-[3px]`), petites capitales, **barre latérale gauche** colorée — rappel du talon de billet (plus de `rounded-full`).
- **Perforations pointillées** : filets `border-dashed` récurrents (séparations de section, talons du mockup de billet, colonnes de fonctionnalités) et trame de points en fond du hero.
- **Contraste clair/sombre** : sections alternant fond clair (`Slate Background`) et fond sombre (`Midnight Dark`, via `bg-slate-950`) — ex. section « Fonctionnalités » de la landing.
- **Chiffres tabulaires** (`tabular-nums`) et `font-mono` pour les montants/codes (ex. KPI, `50 $`, `A4B-8K9`) : évoquent le code d'un billet.
- **Accent cyan** réservé aux éléments d'accent (eyebrows, icônes KPI, barres latérales) ; le **bleu** reste la couleur des CTA primaires.
- **Menu mobile (overlay)** : panneau qui se superpose au contenu (backdrop flouté, fermeture par Échap/backdrop/lien) ; **icône animée hamburger ⇄ flèche vers le haut** (`components/ui/animated-menu-icon.tsx`), volontairement distincte d'une croix type « X ».

Anti-patterns bannis : badges-pilules arrondis teintés, cartes `rounded-xl` + `shadow-sm` systématiques, hero symétrique centré, dégradés criards sur les boutons.

---

## 2. SPÉCIFICATIONS DÉTAILLÉES PAR PAGE / MODULE

### Rôles utilisateurs

- **Organisateur** : crée/configure les événements, fixe les tarifs, suit les ventes, exporte les invités, génère des accès équipe.
- **Participant / Acheteur** : découvre l'événement via un lien, réserve, paie en Mobile Money, reçoit son billet numérique (QR + code 6 caractères).
- **Agent de contrôle (scanneur)** : dispose d'un **compte dédié créé par l'organisateur** (email + mot de passe), restreint à la seule interface de scan des événements qui lui sont assignés — sans accès aux ventes, revenus, contrats ni réglages.

### 📄 Landing — Route `/`

**Objectif** : présenter le produit et orienter vers la création d'événement ou la démo de billetterie.

- Section héro **asymétrique** (étiquette « talon » `Eyebrow` « Billetterie sécurisée en RDC », H1, sous-titre, 2 CTA) + trame de points en fond (perforation).
- Mockup de billet « talon détachable » (carte sombre `Midnight Dark`, en-tête kinPass cyan, code `A4B-8K9` en mono, QR).
- Section 3 fonctionnalités sur fond sombre (Scan QR instantané / Code de secours / Mobile Money), séparées par des filets pointillés.
- Footer (copyright) séparé par un filet pointillé.
- **État** : ✅ fait (refonte « billet/talon », cf. §1.5).

### 📄 Authentification — Routes `/auth/login` et `/auth/register` (À VENIR)

- Email + mot de passe (bcrypt), formulaire login et register séparés.
- Validation (Zod) : email requis/format ; mot de passe min 8, une majuscule, une minuscule, un chiffre.
- Icônes Iconoir `Mail` / `Lock`.
- Comportement : **une seule page `/auth/login`** commune à tous les rôles → session cookie → **redirection selon le rôle** (`organizer` → `/dashboard`, `agent` → `/scan`) ; `register` → création utilisateur (rôle `organizer`) → `/dashboard`.

### 📄 Tableau de bord organisateur — Route `/dashboard` (À VENIR, protégée)

- **KPIs temps réel** : chiffre d'affaires (USD/CDF), billets vendus, taux de remplissage, personnes entrées (scannées).
- **Liste des événements** : cartes avec statut (Brouillon / Publié / Terminé), progression des ventes, accès à la gestion.
- **État** : ✅ fait (`components/features/dashboard/OrganizerDashboard.tsx`, branché sur les données réelles via `getOrganizerEvents()` — KPIs agrégés en base, actions Publier/Éditer/Supprimer).

### 📄 Création d'événement — Route `/events/new` (À VENIR, protégée)

- Informations générales : titre, description, catégorie (Concert/Conférence/Festival/Soirée privée/Autre — « Autre » affiche un champ libre « Type d'événement »).
- Localisation & date : lieu, date/heure début, date/heure fin.
- Visuel : upload de l'affiche (Supabase Storage / Vercel Blob) — **MVP : champ URL** (`poster_url`).
- **Paramétrage des billets** : plusieurs types (Standard/VIP/Invitation), prix, devise, capacité par type.
- Slug unique `/e/[slug]` généré depuis le titre.
- **État** : ✅ fait (`components/features/event-creation/EventCreationForm.tsx` — persistance réelle via Server Actions, multi-types de billets dynamiques, validation Zod + client, mode édition pré-rempli ; navigation par état SPA, la vraie route `/events/new` viendra avec le passage au routing par URL).

### 📄 Page publique événement — Route `/e/[slug]` (À VENIR, publique)

- Affiche (`poster_url`) + **galerie de 1 à 3 photos descriptives** (table `event_images`), description, tarifs, bouton d'achat.
- Lien partageable WhatsApp/réseaux ; métadonnées SEO dynamiques (`og:image` = affiche).

### 📄 Tunnel d'achat & billetterie — Route `/e/[slug]/checkout` (À VENIR, publique)

- Sélection quantité + type de billet ; coordonnées acheteur (nom, téléphone Mobile Money, email optionnel) ; total calculé.
- **Commandes** : tables `orders` / `order_items` (regroupement des achats multi-billets).
- **Paiement Mobile Money** : M-Pesa / Orange Money / Airtel Money (agrégateur ou flux simulé pour MVP) + webhook de confirmation.
- **Billet numérique** : **QR Code dynamique** + **code alphanumérique unique de 6 caractères** (ex. `K9M-4X2`).
- **Remise du billet** : au choix **envoi par email** (PDF en pièce jointe) **ou téléchargement direct** (PDF / PNG / JPG) ; pages de confirmation (`/success`) et d'annulation (`/cancel`).
- **État** : 🚧 maquette (`components/features/checkout/TicketCheckout.tsx` — prix codé en dur 38 $, paiement factice, code codé en dur `A4B-8K9`).

### 📄 Contrôle d'accès — Route `/scan/[slug]` (À VENIR)

- **Accès agent** : l'organisateur crée des **comptes scanneurs** (email + mot de passe) depuis ses paramètres, et les assigne à un ou plusieurs événements. L'agent se connecte puis accède à l'interface de scan des événements assignés.
- **Restrictions strictes (RBAC)** : un scanneur ne voit que ses événements assignés ; il n'a **aucun accès** au dashboard, aux ventes/revenus, aux reversements, aux contrats ni aux réglages de l'organisateur.
- **Double interface** : (1) caméra QR ; (2) champ de saisie manuelle du code 6 caractères (majuscules auto, tirets ignorés).
- **Retours visuels + sonores** : VERT (valide, nom + type), ORANGE (déjà scanné, heure du 1er passage), ROUGE (invalide/étranger).
- **État** : 🚧 maquette (`components/features/scanner/Scanner.tsx` — saisie manuelle + normalisation + 3 états visuels, mais codes codés en dur `A4B8K9`/`X7PM3R`, pas de caméra, pas de compte, pas de DB).

### 📄 Gestion des scanneurs — section de `/settings` (À VENIR, protégée)

- Rubrique « Équipe / Scanneurs » dans les paramètres de l'organisateur : créer, lister, désactiver des comptes scanneurs, et les assigner à des événements.
- Chaque scanneur reçoit un **email synthétique unique auto-généré** (`{slug}-{n}@kinpass.com`) — l'organisateur ne choisit que le nom et le mot de passe ; les identifiants sont transmis à l'agent de contrôle.
- Connexion via la **page unique `/auth/login`**, redirection automatique vers l'interface de scan selon le rôle.
- Permissions limitées : **scan uniquement**, aucun accès aux données sensibles (cf. §4 Phase 7).

### 📄 Profil organisateur — Route `/settings` (À VENIR, protégée)

- **Rubriques à compléter avant de créer un événement** : photo de profil, numéro WhatsApp, adresse, **comptes de reversement** (M-Pesa / Airtel Money / Orange Money / virement).
- **Équipe / Scanneurs** : création et gestion des comptes de contrôle (cf. §4 Phase 7).
- Blocage de la publication d'un événement si aucun compte de reversement n'est renseigné. Détail : §4.2.

### 📄 Vitrine publique & listing — Landing + Route `/events` (À VENIR)

- La landing affiche les **événements publiés à venir/en cours** (cartes : affiche, titre, date, lieu, prix « à partir de X $ ») → `/e/[slug]`.
- Filtres par catégorie et recherche ; page de listing `/events` (SEO). Détail : §4 Phase 9.

### 📄 Vérification de billet — Route `/verify` (À VENIR, publique)

- Saisie du code du billet (6 caractères) → 3 états (valide / déjà utilisé / introuvable), réutilisant la sémantique scanner VERT/ORANGE/ROUGE.
- Si valide : **re-téléchargement** (PDF/PNG/JPG) et **renvoi par email**. Détail : §4 Phase 12.

### 📄 Monétisation & reversement — section du `/dashboard` (À VENIR, protégée)

- « Solde disponible », historique des reversements, bouton « Retirer » (retrait à la demande, commission kinPass prélevée à chaque retrait). Détail : §4 Phase 10.

### 📄 Conformité & pages légales (À VENIR, publiques)

- CGU, Politique de confidentialité, Contrat de prestation & règles de reversement, Contact/Support, À propos. Détail : §4 Phase 11.

### 📄 Export & reporting — page « Détail événement » (À VENIR, protégée)

- Ventes, revenus, taux de remplissage, liste des billets ; **export PDF** du rapport et **export CSV** des participants. Détail : §4 Phase 13.

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
| `category`            | varchar(50)  |                              | Concert/Conférence/Festival/Soirée/Autre |
| `category_custom`     | varchar(100) |                              | Type personnalisé si `category = 'Autre' |
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

### 🟡 Phase 4 — Authentification & compte organisateur (EN COURS — 4.1 faite)

#### 4.1 Inscription / connexion

- [x] `lib/auth.ts` : inscription + connexion, hash `bcrypt` (bcryptjs), sessions par cookies JWT (`jose`, HS256), rôle `organizer` par défaut, cookie `httpOnly` + `secure` + `sameSite=lax`, `AUTH_SECRET` en env.
- [x] **Deux rôles** : `organizer` (auto-inscription) et `agent`/scanneur (créé uniquement par un organisateur, jamais en auto-inscription — cf. Phase 7). Le rôle `agent` sera branché avec la Phase 7.
- [x] Routes App Router `/auth/register` et `/auth/login` (formulaires séparés, icônes Iconoir `Mail` / `Lock`), pages placeholder `/auth/forgot-password` et `/legal/cgu` (contenu complet en Phase 11).
- [x] Validation Zod (messages français) : email valide + unique ; mot de passe ≥ 8 caractères, une majuscule, une minuscule, un chiffre ; nom complet requis ; confirmation du mot de passe.
- [x] Écran register : email, mot de passe, confirmation, nom complet, **case « J'accepte les Conditions Générales » obligatoire** (lien placeholder — cf. Phase 11).
- [x] Écran login : email + mot de passe, lien « Mot de passe oublié » (placeholder — reset par email en Phase 11), erreur générique « Identifiants invalides ».
- [x] Après login/register → redirection `/?view=dashboard` (SPA) ; `?next=` supporté pour les futures routes ; header connecté/déconnecté dans la coquille.
- [x] Middleware protégeant `/dashboard`, `/events/*`, `/scan/*` (redirection vers `/auth/login?next=...` si non authentifié) ; pages `/auth/*` redirigent un utilisateur connecté.
- [x] Remplacement de `DEFAULT_ORGANIZER_ID` par l'ID de session dans **toutes** les Server Actions de `lib/actions/events.ts` (session + contrôle de propriété) ; seed mis à jour avec identifiants démo `organisateur@kinpass.test` / `Demo@2026`.
- [ ] Tests E2E (mis à jour pour se connecter — register → login → dashboard ; accès refusé sans session ; logout) : **écrits, exécution sur demande** (règle §0.7).

#### 4.2 Profil organisateur (rubriques à compléter avant de créer un événement)

**Objectif** : seul celui qui crée un événement a besoin d'un compte. Il doit pouvoir **finaliser son profil** (photo, WhatsApp, compte de reversement, adresse) dans une page de paramètres dédiée, avant de publier.

- [ ] Page `/dashboard/settings` (ou `/settings`) avec sections :
  - **Photo de profil** : upload → stockage (Supabase Storage / Vercel Blob), aperçu circulaire dans le header et le dashboard.
  - **Numéro WhatsApp** : `users.phone_whatsapp` (format international `+243…`), utilisé pour les notifications et le contact acheteurs.
  - **Adresse / ville / commune** : `users.address`.
  - **Comptes de reversement** : 1 à N méthodes (M-Pesa / Airtel Money / Orange Money / virement bancaire) — table `payout_methods` (id, user_id, provider, libellé, numéro/téléphone, titulaire, is_default).
  - **Équipe / Scanneurs** : création et gestion des comptes de contrôle (détail complet en Phase 7.2).
- [ ] Server Action `updateProfile` (validation Zod, upload avatar, upsert des comptes de reversement).
- [ ] Badge « Profil incomplet » affiché sur le dashboard tant que les champs obligatoires manquent ; **blocage de la publication d'un événement si aucun compte de reversement n'est renseigné** (message explicite : « Ajoutez un compte de reversement pour publier »).
- [ ] Tests : complétion du profil, upload photo, ajout/suppression/choix du compte de reversement par défaut.

#### 4.3 Modèle de données (ajouts)

- `users` : `avatar_url text`, `phone_whatsapp varchar(30)`, `address text`.
- Nouvelle table `payout_methods` (cf. ci-dessus), FK `user_id` → `users` ON DELETE CASCADE, index sur `user_id`.

### ✅ Phase 5 — Gestion des événements (FAITE — sans auth, organisateur de test)

- [x] Server Actions `lib/actions/events.ts` : créer/lire/éditer/publier/supprimer (persistance en base, transactions atomiques, slug unique, validation Zod en français, `organizer_id` fixe temporaire).
- [x] Formulaire `EventCreationForm` branché (multi-types de billets dynamiques, affiche par URL, validation client + serveur, mode édition) — navigation par état SPA en attendant le routing.
- [x] Dashboard `OrganizerDashboard` branché sur les données réelles (KPIs agrégés, progression des ventes, actions Publier/Éditer/Supprimer).
- [x] Données de démo : `scripts/seed-demo.mts` (organisateur de test + 2 événements, billets, scans ; option `--reset`).

### ❌ Phase 6 — Billetterie publique & paiement (À VENIR)

#### 6.1 Page publique événement + galerie photos (1 à 3)

- [ ] Route publique `/e/[slug]` : affiche, description, catégorie, dates, lieu, tarifs (types de billets), bouton d'achat, lien partageable WhatsApp/réseaux.
- [ ] **Galerie de 1 à 3 photos descriptives** : nouvelle table `event_images` (id, event_id, url, alt, position, created_at) ; carrousel léger côté public ; `poster_url` reste la « une ».
- [ ] Extension d'`EventCreationForm` : section « Visuels » permettant d'ajouter jusqu'à 3 images (URL au MVP, upload réel dès que le stockage est branché), avec suppression et réordonnancement (position).
- [ ] Server Action `updateEvent` enrichie : gestion des `event_images` (ajout/suppression/ordre), validation d'un maximum de 3.
- [ ] SEO : métadonnées dynamiques par événement (`title`, `description`, `og:image` = affiche).

#### 6.2 Tunnel d'achat + commandes (`orders`)

- [ ] Route `/e/[slug]/checkout` : sélection du type de billet + quantité, coordonnées acheteur (nom, téléphone Mobile Money, email optionnel), calcul du total (prix × quantité).
- [ ] Table `orders` (id, event_id, buyer_name, buyer_phone, buyer_email, total_amount, currency, delivery_method, status, payment_ref, created_at) + `order_items` (id, order_id, ticket_type_id, quantity, unit_price) — regroupement des achats multi-billets.
- [ ] Génération du **code alphanumérique unique de 6 caractères** par billet (fonction utilitaire + contrainte UNIQUE, retry en cas de collision) + **QR Code** (`qrcode.react`).
- [ ] `tickets.order_id` → lien vers la commande (nullable pour rétro-compatibilité).

#### 6.3 Choix de remise du billet : email OU téléchargement (PDF / PNG / JPG)

- [ ] À l'achat, l'acheteur choisit la remise : « Recevoir par email » **OU** « Télécharger maintenant ».
- [ ] `orders.delivery_method` : `email` | `download` (modifiable après paiement via la page de confirmation).
- [ ] Génération du billet :
  - **PDF** : rendu serveur (bibliothèque PDF, ex. `@react-pdf/renderer` ou Puppeteer) avec nom, type, événement, QR et code 6 caractères.
  - **PNG / JPG** : rendu de la carte billet en image (SVG → PNG/JPG) pour partage et sauvegarde.
- [ ] Email : envoi du billet en pièce jointe PDF + lien de téléchargement sécurisé (provider email configurable : Resend / SendGrid / Postmark).
- [ ] Téléchargement direct : boutons « PDF », « PNG », « JPG » sur la page de confirmation.
- [ ] Re-téléchargement / renvoi possible depuis « Vérifier mon billet » (Phase 12).

#### 6.4 Paiement Mobile Money + webhook de confirmation

- [ ] Intégration agrégateur (KPAY) **OU** flux simulé MVP (bouton « Simuler le paiement »).
- [ ] Webhook de confirmation → passage de la commande et des billets au statut `paid`, génération des billets, envoi de l'email si demandé.
- [ ] Gestion des états : `pending`, `paid`, `failed`, `expired` (expiration après X minutes).

#### 6.5 Pages de confirmation & redirection (acheteur)

- [ ] Page `/e/[slug]/checkout/success` : récapitulatif (événement, billets, codes, QR), boutons de téléchargement (PDF/PNG/JPG), bouton « Envoyer par email », bouton « Ajouter au calendrier ».
- [ ] Page `/e/[slug]/checkout/cancel` : message clair d'échec/annulation + bouton « Réessayer ».
- [ ] Écran de redirection pendant le paiement : « Redirection vers Mobile Money… » (spinner, time-out).

#### 6.6 Modèle de données (ajouts)

- Tables `event_images`, `orders`, `order_items` (cf. ci-dessus) ; `tickets.order_id` FK nullable.

### ❌ Phase 7 — Contrôle d'accès & comptes scanneurs (À VENIR)

**Dépend de** : Phase 4 (authentification), Phase 5 (événements), Phase 6 (billets émis).

**Décision (validée)** : les agents de contrôle disposent de **comptes dédiés créés par l'organisateur**, avec un **RBAC strict** (accès au seul scan des événements assignés, jamais aux ventes/contrats/réglages). **Option A retenue : emails synthétiques uniques auto-générés** (ex. `event1-01@kinpass.com`, `event1-02@kinpass.com`), un compte = un email unique, un mot de passe par scanneur.

#### 7.1 Comptes scanneurs & restrictions (RBAC)

- [ ] Réutiliser `users.role` (`organizer` | `agent`) ; ajouter `users.organizer_id` (uuid nullable, FK `users` ON DELETE SET NULL) pour rattacher un agent à son organisateur.
- [ ] **Emails synthétiques uniques auto-générés** : au moment de créer un scanneur, l'UI génère `{slug}-{n}@kinpass.com` (n incrémental par événement) ; l'organisateur **ne saisit pas** l'email, il choisit uniquement le nom et le mot de passe. Le domaine `@kinpass.com` marque visuellement un compte interne.
- [ ] Nouvelle table `agent_event_access` (id, agent_id FK `users` CASCADE, event_id FK `events` CASCADE, created_at) — index sur `agent_id` et `event_id` — pour définir **quels événements** un agent peut scanner.
- [ ] Section « Équipe / Scanneurs » dans `/settings` : lister les agents (nom, email généré, événements assignés), bouton « Ajouter un scanneur » (nom + mot de passe + sélection des événements), désactivation/réactivation, suppression, réinitialisation du mot de passe.
- [ ] Server Actions `createAgent`, `updateAgent`, `deactivateAgent`, `assignAgentToEvent`, `unassignAgentToEvent`, `resetAgentPassword` — toutes protégées par `role === 'organizer'` **et** `organizer_id === session.id` (défense en profondeur).
- [ ] Pas de « mot de passe oublié » pour un agent (email factice) : c'est l'organisateur qui réinitialise via `resetAgentPassword`.
- [ ] `scans.agent_id` renseigné automatiquement avec l'agent connecté à chaque scan (traçabilité).

#### 7.2 Flux de connexion (page unique + redirection par rôle)

**Objectif** : une seule page de connexion, aucune page séparée admin/scan ; la redirection se fait **en arrière-plan selon le rôle** stocké en base (jamais selon le format de l'email).

1. [ ] **Une seule page** `/auth/login` (email + mot de passe), commune à tous les rôles.
2. [ ] Server Action `login(email, password)` :
   - Recherche `users` par `email` (index UNIQUE `users_email_idx`).
   - Introuvable → erreur générique « Identifiants invalides » (pas d'énumération de compte).
   - `bcrypt.compare(password, passwordHash)` ; échec → erreur générique + **rate-limit** (par email **et** par IP).
   - `users.active === false` → « Compte désactivé ».
3. [ ] Création de la session (cookie `httpOnly` + `secure` + `sameSite=lax`) avec `{ userId, role }`.
4. [ ] **Redirection par rôle** (depuis `users.role`, PAS depuis le texte de l'email) :
   - `organizer` → `/dashboard` ;
   - `agent` → `/scan` (accueil scanneur : liste des événements assignés via `agent_event_access`, puis `/scan/[slug]`).
5. [ ] **Middleware (double protection)** : `/dashboard`, `/settings`, `/events/*`, `/payouts` exigent `role === 'organizer'` ; `/scan/*` exige `role === 'agent'` (ou `organizer`) ; écart → redirection par rôle.
6. [ ] Vérification serveur du rôle dans **chaque** Server Action d'organisation (revenus, contrats, exports, billets, gestion des scanneurs) : refuser tout accès `agent`.

#### 7.3 Interface de scan

- [ ] Route `/scan/[slug]` : caméra QR (`html5-qrcode`) + champ de saisie manuelle (majuscules auto, tirets ignorés).
- [ ] Validation en base < 500 ms (index UNIQUE `tickets.code`).
- [ ] États VERT (valide, nom + type) / ORANGE (déjà scanné, heure du 1er passage) / ROUGE (invalide/étranger) + retour sonore.
- [ ] Écriture dans `scans` + mise à jour `tickets.status` (`valid` → `used`) + `scanned_at`.

#### 7.4 Modèle de données (ajouts)

- `users` : `organizer_id` (uuid nullable, FK self), `active` (boolean default true — désactivation douce des agents).
- Nouvelle table `agent_event_access`.

#### 7.5 Tests

- [ ] E2E : l'organisateur crée un scanneur (email auto-généré affiché) et l'assigne à un événement ; le scanneur se connecte sur `/auth/login` et est **redirigé vers `/scan`** (uniquement son événement) ; il est **bloqué** sur `/dashboard` et `/settings` ; un organisateur est redirigé vers `/dashboard`.
- [ ] Unitaire : `login` redirige selon `role` ; un `agent` ne peut pas appeler les actions organisateur ; génération d'email synthétique unique sans collision.

### 🟡 Phase 8 — Polish & robustesse (EN COURS — E2E + enrichissement visuel faits, reste à faire)

- [x] Tests E2E Playwright (`tests/e2e/`, 15 scénarios : landing, dashboard, événements, checkout, scanner).
- [x] Enrichissement visuel : photos Pexels (proxy `/api/pexels`, clé serveur), animations Framer Motion (`FadeIn`/`MotionCard`, reduced-motion), illustrations SVG de marque (`public/illustrations/`), feedbacks Lottie (`public/lottie/` : paiement, succès, scan).
- [ ] Tests unitaires (composants + Server Actions).
- [ ] Sécurisation des routes (validation billets / modification événements).
- [ ] PWA (manifest + service worker) + export listes invités (reporté en Phase 13 pour l'export enrichi).

### ❌ Phase 9 — Vitrine publique : événements sur la landing (À VENIR)

**Objectif** : la landing doit afficher les **événements publiés en cours ou à venir**, pour transformer la page d'accueil en vitrine.

- [ ] Server Action `getPublicEvents` : événements `status = published` dont `start_at >= now` (ou en cours), triés par date, avec affiche, titre, lieu, prix minimum.
- [ ] Section « Événements à venir » sur la landing : cartes (affiche, titre, date, lieu, prix « à partir de X $ »), clic → `/e/[slug]`.
- [ ] Filtres simples : par catégorie (Concert/Conférence/Festival/Soirée privée/Autre) et/ou recherche par titre.
- [ ] État vide élégant : « Aucun événement à venir pour le moment » + incitation à créer le sien.
- [ ] Page listing publique `/events` (grille) — optionnel mais recommandé pour le SEO.
- [ ] Respect du langage visuel « billet/talon » : cartes angulaires, bordure, accent cyan, chiffres tabulaires.
- [ ] Tests : la landing affiche les événements publiés du seed, masque les brouillons ; navigation carte → `/e/[slug]`.

### ❌ Phase 10 — Monétisation & reversement des revenus (À VENIR)

**Objectif** : reverser les revenus des billets à l'organisateur, en prélevant la commission kinPass.

**Décision (validée)** : le modèle retenu est le **retrait à la demande** (« pull ») :

1. Plus simple à implémenter (pas de tâche planifiée ni de compte d'attente).
2. L'organisateur contrôle quand il retire (liquidité, planification).
3. À **chaque retrait**, kinPass calcule et prélève son pourcentage avant envoi, puis reverse le net sur le compte choisi (M-Pesa / Airtel Money / Orange Money / virement), et la commission part vers le compte KPay de kinPass/Premice.
4. Risque opérationnel limité (pas de flux d'argent non sollicité).

Un **reversement automatique périodique** (ex. chaque vendredi) pourra être proposé plus tard en option, mais il n'est pas retenu pour la première version.

- [ ] Constante `KINPASS_FEE_PERCENT` (ex. 0.3 %) dans `lib/constants.ts`, surchargeable par variable d'environnement.
- [ ] Dashboard : carte « Solde disponible » (revenus nets), historique des reversements (montant brut, commission, net, statut, date), bouton « Retirer ».
- [ ] Table `payouts` (id, organizer_id, amount_total, fee_percent, fee_amount, net_amount, provider, account_label, reference, status, requested_at, paid_at) — index sur `organizer_id` et `status`.
- [ ] Server Action `requestPayout(amount)` : vérifie le solde disponible (revenus non reversés), crée un `payout` en `pending`, calcule `fee_amount = amount × %` et `net_amount = amount - fee_amount`.
- [ ] Exécution du virement : intégration KPay (payout Mobile Money) **ou** validation manuelle par l'admin qui passe le `payout` en `paid` et envoie le net ; la commission est enregistrée comme revenu kinPass.
- [ ] Notifications organisateur : « Retrait demandé », « Retrait envoyé », « Retrait échoué » (email/WhatsApp).
- [ ] Règle métier : impossible de retirer plus que le solde disponible ; montant minimum de retrait (ex. 25 $) ; 1 retrait en cours à la fois.
- [ ] Tests : calcul de la commission, refus de retrait si solde insuffisant, historique cohérent.

### ❌ Phase 11 — Confiance, conformité & contrat (À VENIR)

**Objectif** : montrer que kinPass est sérieux et rassurer les créateurs d'événements (et les acheteurs).

- [ ] Pages légales accessibles depuis le footer : **Conditions Générales d'Utilisation (CGU)**, **Politique de Confidentialité** (adaptée RDC), **Contrat de prestation & règles de reversement**, page **Contact/Support**, page **À propos**.
- [ ] Contenu détaillé du **contrat de prestation** : pourcentage de commission kinPass, fréquence/calendrier de reversement, mode de retrait, responsabilités de chaque partie, gestion des annulations et remboursements, propriété des données, données collectées et usage.
- [ ] Case à cocher d'acceptation à l'inscription (cf. Phase 4.1) ; table `contract_acceptances` (id, user_id, document_type, version, accepted_at) — **re-signature requise si le contrat évolue** (numéro de version).
- [ ] Mention de la commission clairement affichée dans le dashboard (ex. « kinPass prélève 0.3% sur chaque vente d'un billet»).
- [ ] (Option) Badge « Organisateur vérifié » (vérification d'identité) pour renforcer la confiance.
- [ ] Tests : inscription bloquée sans acceptation des CGU ; versionnage du contrat.

### ❌ Phase 12 — Vérification & re-téléchargement du billet (public) (À VENIR)

**Objectif** : n'importe qui (acheteur ou agent) peut vérifier la validité d'un billet en saisissant son code, et le re-télécharger.

- [ ] Route publique `/verify` (accessible sans compte) ; rubrique « Vérifier mon billet » également accessible depuis `/e/[slug]`.
- [ ] Écran : saisie du code (6 caractères, majuscules automatiques, tirets ignorés) + bouton « Vérifier ».
- [ ] Server Action `verifyTicket(code)` : recherche par `tickets.code` (index UNIQUE), retourne { événement, type de billet, acheteur, statut }.
- [ ] Affichage des 3 états (réutilise la sémantique scanner VERT/ORANGE/ROUGE) : **valide** (non utilisé), **déjà utilisé** (heure du premier scan), **introuvable/invalide**.
- [ ] Si valide : boutons « Re-télécharger » (PDF/PNG/JPG) et « Renvoyer par email ».
- [ ] Anti-abus : rate-limiting sur la vérification (éviter le bruteforce des codes), pas d'énumération (message générique pour « introuvable »).
- [ ] Tests : vérification d'un code valide, d'un code utilisé, d'un code inconnu ; re-téléchargement.

### ❌ Phase 13 — Export & reporting organisateur (À VENIR)

**Objectif** : le créateur voit tout concernant son événement depuis le dashboard, et peut exporter un rapport PDF + la liste des participants.

- [ ] Page « Détail de l'événement » (clic sur un événement dans le dashboard) : ventes (par type), revenus (brut/net/commission), taux de remplissage, liste des billets (acheteur, type, code, statut), nombre de scans.
- [ ] **Export PDF** (génération serveur) : rapport complet — infos événement, tableau des billets, revenus, détail des reversements — bouton « Télécharger le rapport ».
- [ ] **Export CSV** des participants (nom, téléphone, email, type de billet, code, statut) pour la gestion à la porte.
- [ ] Filtres avant export : par type de billet, par statut (valide/utilisé/annulé).
- [ ] Tests : génération du PDF/CSV, cohérence des données exportées avec la base.

### ❌ Phase 14 — Événements à entrée libre (gratuits) & RSVP (À VENIR)

**Objectif** : permettre des événements **gratuits** de bout en bout. Pour l'organisateur comme pour l'acheteur, **kinPass ne facture rien** : commission 0 (0 × `KINPASS_FEE_PERCENT` = 0), aucun paiement Mobile Money exigé, aucun frais caché.

**Décision (validée)** : pas de drapeau global « gratuit ». Un événement est gratuit si **tous ses types de billets ont un prix de 0** (ex. type « Entrée libre »). Le système détecte automatiquement le mode gratuit (total de commande = 0) et saute toute la chaîne de paiement. Avantages : un événement peut mélanger entrée gratuite et places payantes (ex. « Entrée libre » + « VIP 30 $ »), et aucune logique de commission à dériver.

#### 14.1 Création (côté organisateur)

- [ ] Helper dans `EventCreationForm` : bouton « Entrée libre » qui pré-remplit un type `price = 0` (nom suggéré « Entrée libre », devise USD, capacité au choix) et affiche la mention « Événement gratuit : kinPass ne facture ni l'organisateur ni les invités ».
- [ ] Autoriser (comme aujourd'hui) les prix 0 ; validation serveur inchangée (`price >= 0`).
- [ ] Badge/statut visuel dans le dashboard : « Gratuit » sur les événements dont tous les prix sont 0.

#### 14.2 Achat / inscription (côté invité)

- [ ] Checkout : si le total calculé est **0** → écran « Confirmer ma participation » (coordonnées : nom, téléphone, email optionnel) **sans** étape Mobile Money, sans webhook, sans écran « Redirection… ».
- [ ] Confirmation immédiate : génération du billet (code 6 caractères + QR) et remise (email ou téléchargement PDF/PNG/JPG), mêmes options que le payant.
- [ ] Page publique `/e/[slug]` : afficher « **Entrée libre** » (vert, emphase) au lieu d'un prix quand le type est à 0.
- [ ] Anti-abus : limite d'inscriptions par numéro de téléphone (ex. 5) pour éviter l'accaparement des places gratuites.

#### 14.3 Suivi & statistiques

- [ ] Dashboard : les événements gratuits affichent les KPIs de **participation** (inscriptions, taux de remplissage, entrées scannées) ; ligne revenus = 0 $ (aucune commission prélevée, aucune ligne dans l'historique de reversement).
- [ ] État « jauge pleine » : si la capacité est atteinte, la page publique indique « Complet » et bloque l'inscription.
- [ ] Export CSV/PDF (Phase 13) déjà compatible (les billets existent) ; vérifier l'affichage « Gratuit ».

#### 14.4 Tests

- [ ] E2E (écrits ; exécution sur demande) : inscription à un événement gratuit sans aucune étape de paiement ; événement mixte (gratuit + VIP payant) ; jauge pleine ; commission 0 dans le dashboard.
- [ ] Unitaire : calcul de commission sur total 0 ; détection du mode gratuit.

### ❌ Phase 15 — Innovations différenciantes (marché de Kinshasa) (À VENIR)

**Contexte** : les plateformes de billetterie présentes à Kinshasa proposent toutes le même schéma — billet payant en ligne, QR statique, communication par email. Pour **démarquer kinPass**, les modules suivants ciblent les réalités congolaises : WhatsApp (canal roi), paiement en espèces, diaspora, fraude aux QR, et économie informelle des « rabatteurs ». Chaque module est indépendant et peut être activé séparément.

#### 15.1 WhatsApp-first (livraison, rappels, annulation) — priorité haute

**Pourquoi ça démarque** : au Congo, WhatsApp est LE canal de communication. Les concurrents utilisent l'email, que la majorité n'ouvre pas.

- [ ] Livraison du billet par **WhatsApp** (Business API) en plus de l'email : envoi du billet (image/PDF) + lien de téléchargement.
- [ ] Rappels automatiques : J-3, J-1, J-2h avant l'événement (si l'organisateur active les rappels).
- [ ] Annulation / report d'événement : notification WhatsApp à tous les acheteurs (un seul clic côté organisateur).
- [ ] Préférences : l'acheteur choisit email et/ou WhatsApp ; MVP = lien `wa.me` pré-rempli, production = WhatsApp Business Cloud API.
- [ ] Tests E2E (écrits ; exécution sur demande) : parcours « recevoir par WhatsApp », rappel programmé.

#### 15.2 QR dynamique anti-fraude (anti capture d'écran)

**Pourquoi ça démarque** : les QR statiques se screenshotent et se partagent ; c'est la fraude n°1 à la porte.

- [ ] QR **régénéré périodiquement** (jeton horodaté, ex. rotation toutes les 60 s) : l'écran du téléphone montre un QR qui change, les captures d'écran deviennent inutilisables.
- [ ] Le scanner valide le jeton (code + fenêtre temporelle) en plus de l'état du billet ; hors fenêtre → « QR expiré, réactualisez ».
- [ ] Règle « un billet = un téléphone » (optionnelle) : le code est lié au numéro de l'acheteur au premier affichage.
- [ ] Compromis documenté : hors-ligne à la porte (réseau faible) → repli sur le code 6 caractères statique classique (toujours fonctionnel).
- [ ] Tests : QR expiré refusé, QR rejoué (relecture du même QR) refusé, code 6 caractères toujours accepté.

#### 15.3 Diaspora : « Je paie, un proche profite »

**Pourquoi ça démarque** : la diaspora congolaise (Europe, USA, Afrique de l'Ouest) paie régulièrement des billets pour sa famille restée au pays, mais ne peut pas utiliser M-Pesa/Airtel/Orange depuis l'étranger.

- [ ] Mode « Offrir un billet » : paiement par **carte bancaire internationale** (Stripe/Paystack) côté payeur.
- [ ] Le bénéficiaire (au pays) reçoit un **code de retrait** par WhatsApp/SMS : il entre le code sur `/redeem` et récupère son billet (PDF/QR) sur son propre téléphone.
- [ ] Mentions obligatoires : nom du payeur visible sur le billet (« Offer par X ») — valeur émotionnelle + traçabilité.
- [ ] Sécurité : code de retrait à usage unique + expiration (72 h), renvoi possible par l'acheteur.
- [ ] Tests : achat diaspora, code de retrait à usage unique, expiration, renvoi.

#### 15.4 Paiement en espèces à l'entrée (réservation sans paiement en ligne)

**Pourquoi ça démarque** : une partie du public n'a pas de Mobile Money ou préfère payer comptant le jour J.

- [ ] Option événement « Paiement à la porte » (par type de billet) : l'invité **réserve** gratuitement (sans paiement), le billet est marqué `reserved` avec un délai (ex. entrée jusqu'à 20 h 30).
- [ ] À la porte : l'agent encaisse (espèces) et valide le billet via l'interface de scan (« Marquer payé ») ; ou l'invité paie par Mobile Money sur place.
- [ ] Anti-fraude : réservation nominative + limite par téléphone ; billet `reserved` non scannable tant qu'il n'est pas `paid`.
- [ ] Dashboard : suivi des réservations non converties (no-show) pour jauger l'affluence réelle.
- [ ] Tests : réservation → paiement à la porte → scan ; réservation expirée refusée.

#### 15.5 Affiliation locale (« rabatteurs ») avec commission Mobile Money

**Pourquoi ça démarque** : à Kinshasa, une grande part des ventes passe par des promoteurs de rue. Aucune plateforme ne les outille ni ne les rémunère automatiquement.

- [ ] L'organisateur génère des **liens d'affiliation** (un par rabatteur : nom, téléphone).
- [ ] Suivi : ventes attribuées au rabatteur, commissions (montant fixe ou % défini par l'organisateur, ex. 1 $ ou 5 %).
- [ ] Paiement des commissions en **Mobile Money** (même infra que les reversements, Phase 10).
- [ ] Espace rabatteur minimal : lien personnel, ventes enregistrées, solde de commissions (sans accès aux données de l'événement).
- [ ] Tests : attribution d'une vente par lien, calcul de commission, versement.

#### 15.6 (Option — plus tard) Cashless événement : porte-monnaie interne

- [ ] Recharge par Mobile Money (ou cash à la porte) → QR de débit scanné par les vendeurs (boissons/marchandises) → l'organisateur reçoit le solde net (commission kinPass déduite).
- [ ] Non prioritaire (besoin d'adoption terrain) ; à réévaluer après les modules 15.1-15.5.

### ❌ Phase 16 — Administration superadmin (back-office du créateur) (À VENIR)

**Objectif** : une interface réservée au **créateur de l'application** pour **tout voir et tout gérer** : paramètres globaux, organisateurs, événements, billets/scans, reversements, et un journal d'audit (« qui fait quoi »).

**Décision (validée — amélioration de l'idée initiale)** :
- **URL distincte** `/superadmin` + **page de connexion dédiée** `/superadmin/login` (branding back-office distinct, pas de page marketing).
- **Pas de page d'inscription publique.** Les comptes superadmin sont **provisionnés par seed** (`scripts/seed-superadmin.mts`) ; les emails autorisés sont dans `.env.local` (`SUPERADMIN_EMAILS`). Zéro surface d'inscription = zéro risque de compte créé par un tiers. Un superadmin peut ajouter d'autres superadmins depuis le back-office.
- **Un seul système d'authentification** : rôle `superadmin` ajouté à `users.role` (aux côtés de `organizer` et `agent`), même session/cookie. `/superadmin/login` n'accepte **que** le rôle `superadmin` (les autres reçoivent un message neutre « accès réservé ») ; `/auth/login` redirige un superadmin vers `/superadmin`.

#### 16.1 Modèle de données (ajouts)

- `users.role` : ajouter `'superadmin'` (enum `organizer` | `agent` | `superadmin`).
- Nouvelle table `audit_logs` (id, actor_id FK `users` SET NULL, action varchar, entity varchar, entity_id uuid, metadata jsonb, created_at) — index sur `actor_id` et `created_at` — pour le « qui fait quoi ».
- Nouvelle table `app_settings` (key varchar UNIQUE, value text, updated_at) — config globale (commission, versions de contrat, feature flags).

#### 16.2 Authentification & sécurité

- [ ] Route `/superadmin/login` dédiée ; middleware : `/superadmin/*` exige `role === 'superadmin'`.
- [ ] Contrôle du rôle **serveur** dans chaque Server Action superadmin (défense en profondeur).
- [ ] Rate-limit sur le login ; mot de passe bcrypt ; (plus tard, option) 2FA TOTP.
- [ ] `scripts/seed-superadmin.mts` : crée les comptes superadmin à partir de `.env.local` `SUPERADMIN_EMAILS` (idempotent, mot de passe fourni en variable d'env `SUPERADMIN_PASSWORD` ou généré et affiché).
- [ ] Journalisation (`audit_logs`) de **toute** action sensible : connexion superadmin, approbation/refus de reversement, suspension/réactivation d'organisateur, modification de `app_settings`, création d'un autre superadmin.

#### 16.3 Vue d'ensemble (KPIs globaux — tableau de bord exécutif)

- [ ] 5-6 KPIs (limite pour rester lisible) : **organisateurs actifs**, **événements publiés**, **billets vendus**, **revenus bruts**, **commission kinPass cumulée**, **reversements en attente**.
- [ ] Tendances sur 7/30 jours + indicateurs de progression ; drill-down (clic → détail).
- [ ] Alerte si le nombre de reversements « en attente » dépasse un seuil (cf. skill KPI : éviter les métriques vaniteuses, privilégier l'actionnable).

#### 16.4 Modules de gestion (la totale)

- [ ] **Organisateurs** : liste + fiche (profil, comptes de reversement, contrats acceptés) ; actions **suspendre / réactiver** (bloque la connexion et la vente).
- [ ] **Événements** : liste de **tous** les événements (tous organisateurs) avec filtres (statut, catégorie), détail, changement de statut forcé.
- [ ] **Billets & scans** : recherche par code de billet, liste des derniers scans, vue d'un billet.
- [ ] **Reversements** : file d'attente des `payouts` `pending` → **approuver / refuser / marquer payé** (flux manuel de la Phase 10) ; historique.
- [ ] **Agents (scanneurs)** : lecture de tous les comptes d'agents et de leurs assignations.
- [ ] **Paramètres globaux** : `KINPASS_FEE_PERCENT`, versions du contrat (CGU/prestation), feature flags (activer/désactiver un module de la Phase 15).
- [ ] **Journal d'audit** : consultation filtrable des `audit_logs` (par acteur, action, période).

#### 16.5 UI back-office

- [ ] Layout dense type « console » (tables, filtres, pagination) — réutiliser `components/ui` ; distinct de l'app publique (pas de hero marketing, accent visuel « zone à risque » sur les actions destructives).
- [ ] Navigation latérale par module ; mode sombre/clair cohérent avec le reste.

#### 16.6 Server Actions & tests

- [ ] Server Actions dédiées (`lib/actions/admin.ts`) : `listOrganizers`, `suspendOrganizer`, `reactivateOrganizer`, `listEvents`, `getEventDetail`, `searchTicket`, `listPayouts`, `processPayout`, `getAuditLogs`, `updateAppSetting` — toutes protégées `role === 'superadmin'`.
- [ ] Tests E2E (écrits ; exécution sur demande) : un superadmin se connecte et voit tout ; un organisateur/agent est **refusé** sur `/superadmin` ; suspension d'organisateur effective ; action journalisée dans l'audit.
- [ ] Unitaire : permissions (organisateur ne peut pas appeler les actions admin), journalisation systématique.

---

## 5. CONTENU OBLIGATOIRE DU FICHIER `README.md`

1. **Titre & description** — kinPass, billetterie et contrôle d'accès en RDC.
2. **À propos** — problème résolu, les 3 rôles (organisateur, acheteur, agent).
3. **Statut du développement** — modules faits / en cours / à venir (sans émojis).
4. **Direction visuelle** — résumé du langage « billet/talon » (renvoi §1.5).
5. **Stack technique** — détaillée (Next.js 16, TypeScript, Tailwind v4, Drizzle, Neon, Zod, Playwright, pnpm), avec le rôle de chaque techno.
6. **Architecture** — App Router, Server Actions, validation, accès données, composants.
7. **Prérequis** — Node.js 20+, pnpm, un compte Neon.
8. **Installation** — `pnpm install`, configuration `.env.local`, seed.
9. **Variables d'environnement** — `DATABASE_URL`.
10. **Commandes** — `pnpm dev`, `build`, `start`, `typecheck`, `db:push`, `db:generate`, `db:studio`, `test:e2e`.
11. **Tests** — Playwright (commandes + renvoi `tests/README.md`).
12. **Structure du projet** — arborescence simplifiée.
13. **Fonctionnalités disponibles** + **Feuille de route**.
14. **Liens utiles** — déploiement Vercel.

---

## 6. STATUT ACTUEL DU PROJET

- **Phase 0** : ✅ TERMINÉE (init + UI kit + Iconoir).
- **Phase 1** : ✅ TERMINÉE (maquette UI des 5 vues).
- **Phase 2** : ✅ TERMINÉE (base Neon + schéma Drizzle appliqué).
- **Phase 3** : ✅ TERMINÉE (logo ticket, dark/light, menu mobile).
- **Phase 4 (auth + compte organisateur)** : 🟡 EN COURS — **4.1 faite** (register/login, session JWT, middleware, Server Actions sécurisées) ; reste : 4.2 profil (photo, WhatsApp, compte de reversement), rôle agent (Phase 7), exécution des tests E2E (sur demande).
- **Phase 5 (événements)** : ✅ TERMINÉE — CRUD complet + publication, organisateur de test fixe (`lib/constants.ts`), à sécuriser par la session dès la Phase 4.
- **Phase 6 (billetterie + paiement)** : ❌ À VENIR — page publique, commandes, remise du billet (email/PDF/PNG/JPG), galerie 1-3 photos, pages de confirmation, webhook Mobile Money.
- **Phase 7 (scanner)** : ❌ À VENIR — interface de scan (caméra + saisie), **comptes scanneurs gérés par l'organisateur avec RBAC strict** (assignation par événement, aucun accès aux ventes/contrats).
- **Phase 8 (polish)** : 🟡 EN COURS — tests E2E faits (15 scénarios) ; unitaires, PWA et export restent.
- **Phase 9 (vitrine publique)** : ❌ À VENIR — événements à venir sur la landing + listing.
- **Phase 10 (monétisation & reversement)** : ❌ À VENIR — commission kinPass, retrait à la demande, table `payouts`.
- **Phase 11 (confiance & contrat)** : ❌ À VENIR — CGU, confidentialité, contrat de prestation, acceptation versionnée.
- **Phase 12 (vérification billet)** : ❌ À VENIR — page `/verify` publique + re-téléchargement.
- **Phase 13 (export & reporting)** : ❌ À VENIR — rapport PDF + export CSV des participants.
- **Phase 14 (entrées libres & RSVP)** : ❌ À VENIR — événements gratuits de bout en bout, commission 0, checkout sans paiement.
- **Phase 15 (innovations différenciantes)** : ❌ À VENIR — WhatsApp-first, QR dynamique anti-fraude, diaspora « je paie, un proche profite », paiement cash à l'entrée, affiliation des rabatteurs.
- **Phase 16 (admin superadmin)** : ❌ À VENIR — back-office `/superadmin` du créateur : vue globale (KPIs), gestion des organisateurs/événements/billets/reversements, paramètres globaux, journal d'audit. Comptes provisionnés par seed (`SUPERADMIN_EMAILS`), rôle `superadmin`.

**Avancement global estimé : ~40 %** (UI + fondations base de données + gestion des événements de bout en bout ; auth, billetterie publique, monétisation et scanner restent à faire).

---

## 7. COMPOSANTS UI & STRUCTURE DU PROJET

```
app/
  page.tsx            # Point d'entrée -> KinPassApp
  layout.tsx          # Layout racine + ThemeProvider + métadonnées
  globals.css         # Tokens Tailwind v4 (clair/sombre)
  api/pexels/route.ts # Proxy Pexels (clé API côté serveur uniquement)
components/
  KinPassApp.tsx      # Coquille SPA — navigation par état
  layout/             # Composants de coquille (header)
    Logo.tsx          # Logo « ticket premium »
    ThemeToggle.tsx   # Bascule clair/sombre
  ui/                 # Primitives atomiques (button, card, input, badge, tabs, eyebrow, motion, empty-state)
  features/           # Vues regroupées par domaine (1 dossier = 1 future route)
    landing/          # LandingPage
    dashboard/        # OrganizerDashboard
    event-creation/   # EventCreationForm
    checkout/         # TicketCheckout
    scanner/          # Scanner
lib/
  actions/events.ts   # Server Actions CRUD événements (+ stats agrégées)
  validators/events.ts # Schémas Zod (messages français) — séparés des actions
  constants.ts        # Organisateur de test temporaire + catégories/devises/statuts
  slug.ts             # slugify + suffixe aléatoire (slug URL unique)
  pexels.ts           # Client API Pexels (serveur uniquement)
  hooks/use-pexels-images.ts  # Hook client de chargement des photos Pexels
  db/
    schema.ts         # Schéma Drizzle (5 tables)
    index.ts          # Client Drizzle (singleton)
  utils.ts            # cn()
public/
  illustrations/      # SVG de marque (états vides, billet numérique)
  lottie/             # Animations Lottie (paiement, succès, scan)
scripts/
  seed-demo.mts       # Seed organisateur de test + données démo (--reset)
tests/
  e2e/                # Tests Playwright (landing, dashboard, événements, checkout, scanner)
playwright.config.ts  # Configuration Playwright
drizzle.config.ts     # Config drizzle-kit
.env.local            # DATABASE_URL (gitignoré)
```

---

## 8. VARIABLES D'ENVIRONNEMENT & COMMANDES

| Variable       | Obligatoire | Description                     |
| :------------- | :---------- | :------------------------------ |
| `DATABASE_URL` | ✅          | URL de connexion Neon (poolée). |
| `PEXELS_API_KEY` | ❌ (optionnelle) | Clé API Pexels (photos pour fonds/couvertures). Sans clé, fallbacks de marque. |
| `AUTH_SECRET` | ✅          | Clé de signature des sessions JWT (≥ 32 caractères, base64url). |

| Commande                     | Description                                                                |
| :--------------------------- | :------------------------------------------------------------------------- |
| `pnpm dev`                   | Serveur de développement                                                   |
| `pnpm build` / `pnpm start`  | Build / démarrage production                                               |
| `pnpm typecheck`             | Vérification TypeScript                                                    |
| `pnpm db:push`               | Pousse le schéma vers la base                                              |
| `pnpm db:generate`           | Génère les migrations SQL                                                  |
| `pnpm db:studio`             | Ouvre Drizzle Studio                                                       |
| `pnpm test:e2e`              | Tests end-to-end Playwright (démarre le serveur automatiquement)           |
| `node scripts/seed-demo.mts` | Seed organisateur de test + données démo (`--reset` pour repartir de zéro) |

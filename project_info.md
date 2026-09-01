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

### 1.5 Langage visuel & signature (refonte « anti-générique »)

La direction visuelle est ancrée dans l'univers du **billet / talon** (cohérente avec le logo). Éléments clés, à conserver dans toute nouvelle UI :

- **Eyebrow** (`components/ui/eyebrow.tsx`) : étiquette de section « talon » = petite règle horizontale + texte en petites capitales espacées, colorée en cyan (`Flash Cyan`). Remplace les anciens badges-pilules arrondis teintés (cliché IA) et les libellés `text-primary`.
- **Badge** (`components/ui/badge.tsx`) : étiquette angulaire (`rounded-[3px]`), petites capitales, **barre latérale gauche** colorée — rappel du talon de billet (plus de `rounded-full`).
- **Perforations pointillées** : filets `border-dashed` récurrents (séparations de section, talons du mockup de billet, colonnes de fonctionnalités) et trame de points en fond du hero.
- **Contraste clair/sombre** : sections alternant fond clair (`Slate Background`) et fond sombre (`Midnight Dark`, via `bg-slate-950`) — ex. section « Fonctionnalités » de la landing.
- **Chiffres tabulaires** (`tabular-nums`) et `font-mono` pour les montants/codes (ex. KPI, `50 $`, `A4B-8K9`) : évoquent le code d'un billet.
- **Accent cyan** réservé aux éléments d'accent (eyebrows, icônes KPI, barres latérales) ; le **bleu** reste la couleur des CTA primaires.

Anti-patterns bannis : badges-pilules arrondis teintés, cartes `rounded-xl` + `shadow-sm` systématiques, hero symétrique centré, dégradés criards sur les boutons.

---

## 2. SPÉCIFICATIONS DÉTAILLÉES PAR PAGE / MODULE

### Rôles utilisateurs

- **Organisateur** : crée/configure les événements, fixe les tarifs, suit les ventes, exporte les invités, génère des accès équipe.
- **Participant / Acheteur** : découvre l'événement via un lien, réserve, paie en Mobile Money, reçoit son billet numérique (QR + code 6 caractères).
- **Agent de contrôle** : accède à une interface dédiée (code PIN) pour scanner ou saisir les codes à la porte.

### 📄 Landing — Route `/`

**Objectif** : présenter le produit et orienter vers la création d'événement ou la démo de billetterie.

- Section héro **asymétrique** (étiquette « talon » `Eyebrow` « Billetterie sécurisée en RDC », H1, sous-titre, 2 CTA) + trame de points en fond (perforation).
- Mockup de billet « talon détachable » (carte sombre `Midnight Dark`, en-tête KIN PASS cyan, code `A4B-8K9` en mono, QR).
- Section 3 fonctionnalités sur fond sombre (Scan QR instantané / Code de secours / Mobile Money), séparées par des filets pointillés.
- Footer (copyright) séparé par un filet pointillé.
- **État** : ✅ fait (refonte « billet/talon », cf. §1.5).

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

- **Accès agent** : URL dédiée + **code PIN** fourni par l'organisateur.
- **Double interface** : (1) caméra QR ; (2) champ de saisie manuelle du code 6 caractères (majuscules auto, tirets ignorés).
- **Retours visuels + sonores** : VERT (valide, nom + type), ORANGE (déjà scanné, heure du 1er passage), ROUGE (invalide/étranger).
- **État** : 🚧 maquette (`components/features/scanner/Scanner.tsx` — saisie manuelle + normalisation + 3 états visuels, mais codes codés en dur `A4B8K9`/`X7PM3R`, pas de caméra, pas de PIN, pas de DB).

### 📄 Profil organisateur — Route `/settings` (À VENIR, protégée)

- **Rubriques à compléter avant de créer un événement** : photo de profil, numéro WhatsApp, adresse, **comptes de reversement** (M-Pesa / Airtel Money / Orange Money / virement).
- Blocage de la publication d'un événement si aucun compte de reversement n'est renseigné. Détail : §4.2.

### 📄 Vitrine publique & listing — Landing + Route `/events` (À VENIR)

- La landing affiche les **événements publiés à venir/en cours** (cartes : affiche, titre, date, lieu, prix « à partir de X $ ») → `/e/[slug]`.
- Filtres par catégorie et recherche ; page de listing `/events` (SEO). Détail : §4 Phase 9.

### 📄 Vérification de billet — Route `/verify` (À VENIR, publique)

- Saisie du code du billet (6 caractères) → 3 états (valide / déjà utilisé / introuvable), réutilisant la sémantique scanner VERT/ORANGE/ROUGE.
- Si valide : **re-téléchargement** (PDF/PNG/JPG) et **renvoi par email**. Détail : §4 Phase 12.

### 📄 Monétisation & reversement — section du `/dashboard` (À VENIR, protégée)

- « Solde disponible », historique des reversements, bouton « Retirer » (retrait à la demande, commission Kin Pass prélevée à chaque retrait). Détail : §4 Phase 10.

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

### ❌ Phase 4 — Authentification & compte organisateur (À VENIR)

#### 4.1 Inscription / connexion

- [ ] `lib/auth.ts` : inscription + connexion, hash `bcrypt`, sessions par cookies (`jose`/`iron-session`), rôle `organizer` par défaut, cookie `httpOnly` + `secure` + `sameSite=lax`.
- [ ] Routes App Router `/auth/register` et `/auth/login` (formulaires séparés, icônes Iconoir `Mail` / `Lock`).
- [ ] Validation Zod (messages français) : email valide + unique ; mot de passe ≥ 8 caractères, une majuscule, une minuscule, un chiffre ; nom complet requis.
- [ ] Écran register : email, mot de passe, confirmation, nom complet, **case « J'accepte les Conditions Générales d'Utilisation et les règles de reversement » obligatoire** (lien vers le contrat — cf. Phase 11).
- [ ] Écran login : email + mot de passe, lien « Mot de passe oublié » (reset par email — cf. Phase 11), gestion des erreurs (« identifiants invalides »).
- [ ] Après login → redirection `/dashboard` ; après register → redirection vers la complétion du profil.
- [ ] Middleware/proxy protégeant `/dashboard`, `/events/*`, `/scan/*` (redirection vers `/auth/login` si non authentifié).
- [ ] Remplacement de `DEFAULT_ORGANIZER_ID` (`lib/constants.ts`) par l'ID de session dans **toutes** les Server Actions de `lib/actions/events.ts` (fin du mode « organisateur de test »).
- [ ] Tests E2E : register → login → accès `/dashboard` ; accès refusé sans session ; logout.

#### 4.2 Profil organisateur (rubriques à compléter avant de créer un événement)

**Objectif** : seul celui qui crée un événement a besoin d'un compte. Il doit pouvoir **finaliser son profil** (photo, WhatsApp, compte de reversement, adresse) dans une page de paramètres dédiée, avant de publier.

- [ ] Page `/dashboard/settings` (ou `/settings`) avec sections :
  - **Photo de profil** : upload → stockage (Supabase Storage / Vercel Blob), aperçu circulaire dans le header et le dashboard.
  - **Numéro WhatsApp** : `users.phone_whatsapp` (format international `+243…`), utilisé pour les notifications et le contact acheteurs.
  - **Adresse / ville / commune** : `users.address`.
  - **Comptes de reversement** : 1 à N méthodes (M-Pesa / Airtel Money / Orange Money / virement bancaire) — table `payout_methods` (id, user_id, provider, libellé, numéro/téléphone, titulaire, is_default).
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

### ❌ Phase 7 — Contrôle d'accès (À VENIR)

- [ ] Route `/scan/[slug]` + code PIN agent.
- [ ] Scan caméra (`html5-qrcode`) + validation en base (< 500 ms).
- [ ] États VERT/ORANGE/ROUGE branchés sur `tickets` + `scans` + retour sonore.

### 🟡 Phase 8 — Polish & robustesse (EN COURS — E2E fait, reste à faire)

- [x] Tests E2E Playwright (`tests/e2e/`, 15 scénarios : landing, dashboard, événements, checkout, scanner).
- [ ] Tests unitaires (composants + Server Actions).
- [ ] Sécurisation des routes (validation billets / modification événements).
- [ ] PWA (manifest + service worker) + export listes invités (reporté en Phase 13 pour l'export enrichi).

### ❌ Phase 9 — Vitrine publique : événements sur la landing (À VENIR)

**Objectif** : la landing doit afficher les **événements publiés en cours ou à venir**, pour transformer la page d'accueil en vitrine.

- [ ] Server Action `getPublicEvents` : événements `status = published` dont `start_at >= now` (ou en cours), triés par date, avec affiche, titre, lieu, prix minimum.
- [ ] Section « Événements à venir » sur la landing : cartes (affiche, titre, date, lieu, prix « à partir de X $ »), clic → `/e/[slug]`.
- [ ] Filtres simples : par catégorie (Concert/Conférence/Mariage/Soirée privée) et/ou recherche par titre.
- [ ] État vide élégant : « Aucun événement à venir pour le moment » + incitation à créer le sien.
- [ ] Page listing publique `/events` (grille) — optionnel mais recommandé pour le SEO.
- [ ] Respect du langage visuel « billet/talon » : cartes angulaires, bordure, accent cyan, chiffres tabulaires.
- [ ] Tests : la landing affiche les événements publiés du seed, masque les brouillons ; navigation carte → `/e/[slug]`.

### ❌ Phase 10 — Monétisation & reversement des revenus (À VENIR)

**Objectif** : reverser les revenus des billets à l'organisateur, en prélevant la commission Kin Pass.

**Décision (validée)** : le modèle retenu est le **retrait à la demande** (« pull ») :

1. Plus simple à implémenter (pas de tâche planifiée ni de compte d'attente).
2. L'organisateur contrôle quand il retire (liquidité, planification).
3. À **chaque retrait**, Kin Pass calcule et prélève son pourcentage avant envoi, puis reverse le net sur le compte choisi (M-Pesa / Airtel Money / Orange Money / virement), et la commission part vers le compte KPay de Kin Pass/Premice.
4. Risque opérationnel limité (pas de flux d'argent non sollicité).

Un **reversement automatique périodique** (ex. chaque vendredi) pourra être proposé plus tard en option, mais il n'est pas retenu pour la première version.

- [ ] Constante `KINPASS_FEE_PERCENT` (ex. 0.3 %) dans `lib/constants.ts`, surchargeable par variable d'environnement.
- [ ] Dashboard : carte « Solde disponible » (revenus nets), historique des reversements (montant brut, commission, net, statut, date), bouton « Retirer ».
- [ ] Table `payouts` (id, organizer_id, amount_total, fee_percent, fee_amount, net_amount, provider, account_label, reference, status, requested_at, paid_at) — index sur `organizer_id` et `status`.
- [ ] Server Action `requestPayout(amount)` : vérifie le solde disponible (revenus non reversés), crée un `payout` en `pending`, calcule `fee_amount = amount × %` et `net_amount = amount - fee_amount`.
- [ ] Exécution du virement : intégration KPay (payout Mobile Money) **ou** validation manuelle par l'admin qui passe le `payout` en `paid` et envoie le net ; la commission est enregistrée comme revenu Kin Pass.
- [ ] Notifications organisateur : « Retrait demandé », « Retrait envoyé », « Retrait échoué » (email/WhatsApp).
- [ ] Règle métier : impossible de retirer plus que le solde disponible ; montant minimum de retrait (ex. 25 $) ; 1 retrait en cours à la fois.
- [ ] Tests : calcul de la commission, refus de retrait si solde insuffisant, historique cohérent.

### ❌ Phase 11 — Confiance, conformité & contrat (À VENIR)

**Objectif** : montrer que Kin Pass est sérieux et rassurer les créateurs d'événements (et les acheteurs).

- [ ] Pages légales accessibles depuis le footer : **Conditions Générales d'Utilisation (CGU)**, **Politique de Confidentialité** (adaptée RDC), **Contrat de prestation & règles de reversement**, page **Contact/Support**, page **À propos**.
- [ ] Contenu détaillé du **contrat de prestation** : pourcentage de commission Kin Pass, fréquence/calendrier de reversement, mode de retrait, responsabilités de chaque partie, gestion des annulations et remboursements, propriété des données, données collectées et usage.
- [ ] Case à cocher d'acceptation à l'inscription (cf. Phase 4.1) ; table `contract_acceptances` (id, user_id, document_type, version, accepted_at) — **re-signature requise si le contrat évolue** (numéro de version).
- [ ] Mention de la commission clairement affichée dans le dashboard (ex. « Kin Pass prélève 0.3% sur chaque vente d'un billet»).
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

---

## 5. CONTENU OBLIGATOIRE DU FICHIER `README.md`

1. **Titre & description** — Kin Pass, billetterie et contrôle d'accès en RDC.
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
- **Phase 4 (auth + compte organisateur)** : ❌ À VENIR — inscription/connexion, profil (photo, WhatsApp, compte de reversement), remplacement de l'organisateur de test.
- **Phase 5 (événements)** : ✅ TERMINÉE — CRUD complet + publication, organisateur de test fixe (`lib/constants.ts`), à sécuriser par la session dès la Phase 4.
- **Phase 6 (billetterie + paiement)** : ❌ À VENIR — page publique, commandes, remise du billet (email/PDF/PNG/JPG), galerie 1-3 photos, pages de confirmation, webhook Mobile Money.
- **Phase 7 (scanner)** : ❌ À VENIR.
- **Phase 8 (polish)** : 🟡 EN COURS — tests E2E faits (15 scénarios) ; unitaires, PWA et export restent.
- **Phase 9 (vitrine publique)** : ❌ À VENIR — événements à venir sur la landing + listing.
- **Phase 10 (monétisation & reversement)** : ❌ À VENIR — commission Kin Pass, retrait à la demande, table `payouts`.
- **Phase 11 (confiance & contrat)** : ❌ À VENIR — CGU, confidentialité, contrat de prestation, acceptation versionnée.
- **Phase 12 (vérification billet)** : ❌ À VENIR — page `/verify` publique + re-téléchargement.
- **Phase 13 (export & reporting)** : ❌ À VENIR — rapport PDF + export CSV des participants.

**Avancement global estimé : ~40 %** (UI + fondations base de données + gestion des événements de bout en bout ; auth, billetterie publique, monétisation et scanner restent à faire).

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
  ui/                 # Primitives atomiques (button, card, input, badge, tabs, eyebrow)
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
  db/
    schema.ts         # Schéma Drizzle (5 tables)
    index.ts          # Client Drizzle (singleton)
  utils.ts            # cn()
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

# Tests end-to-end (Playwright)

Ce dossier contient la suite de tests end-to-end de **Kin Pass**, écrite avec
[Playwright](https://playwright.dev). Les tests vérifient le comportement réel
de l'interface dans un navigateur Chromium (sans mock), contre une base de
données de démonstration réinitialisée avant chaque exécution.

## Lancer les tests

```bash
# Installation des navigateurs (une seule fois)
corepack pnpm exec playwright install chromium

# Exécuter la suite (démarre le serveur Next.js automatiquement)
pnpm test:e2e

# Mode interactif (inspecteur visuel)
pnpm test:e2e:ui

# Mode headed (navigateur visible)
pnpm test:e2e:headed
```

Le serveur de développement est démarré automatiquement par `playwright.config.ts`
(`webServer`) : **inutile de lancer `pnpm dev` séparément**. La base est
réinitialisée par `tests/global-setup.ts` (seed `--reset`), qui requiert
`DATABASE_URL` dans `.env.local`.

## Structure

```
tests/
  global-setup.ts        # Réinitialise la base de démo avant la suite
  e2e/
    helpers.ts           # Utilitaires de navigation (non collecté comme test)
    landing.spec.ts      # Page d'accueil + navigation
    dashboard.spec.ts    # KPIs, liste, publication
    event-creation.spec.ts # Création / édition / suppression / validation
    event-public.spec.ts # Page publique /e/[slug] (Phase 6.1 : galerie, 404)
    vitrine.spec.ts      # Vitrine publique (Phase 9 : bandeau landing, listing, filtres)
    checkout.spec.ts     # Tunnel d'achat /e/[slug]/checkout (6.2-6.4, paiement simulé sans clés KPay)
    scanner.spec.ts      # Contrôle d'accès (maquette, 3 états)
```

## Conventions

- **Noms de tests et `describe` en français**, code et sélecteurs en anglais
  (convention retenue pour ce projet).
- Un fichier `.spec.ts` par **domaine fonctionnel** (même découpage que
  `components/features/*`).
- **Sélecteurs robustes** dans l'ordre de préférence :
  1. `data-testid` (le plus stable) ;
  2. rôles accessibles `getByRole` / `getByLabel` ;
  3. texte visible `getByText` en dernier recours.
- **Attentes automatiques** : utiliser `await expect(locator).toBeVisible()` /
  `toContainText()` plutôt que des `waitForTimeout` fixes.
- Les tests qui écrivent en base **nettoient leurs données** (création puis
  suppression) pour rester indépendants.

## data-testid

Les attributs `data-testid` sont ajoutés dans les composants uniquement lorsque
le sélecteur accessible n'est pas fiable (boutons dynamiques, cartes, états).
Convention de nommage : **kebab-case en anglais**, préfixé par le domaine.

| `data-testid` | Composant | Rôle |
|---|---|---|
| `kpi-revenue`, `kpi-sold`, `kpi-fill-rate`, `kpi-scanned` | `dashboard/OrganizerDashboard.tsx` | Cartes KPI |
| `event-card` | `dashboard/OrganizerDashboard.tsx` | Carte d'un événement |
| `event-title-input` | `event-creation/EventCreationForm.tsx` | Champ titre |
| `submit-event-button` | `event-creation/EventCreationForm.tsx` | Bouton de soumission |
| `add-ticket-type` | `event-creation/EventCreationForm.tsx` | Ajouter un type de billet |
| `ticket-type-row` / `remove-ticket-type` | `event-creation/EventCreationForm.tsx` | Ligne de billet |
| `form-error` / `form-success` | `event-creation/EventCreationForm.tsx` | Messages de formulaire |
| `add-event-image` | `event-creation/EventCreationForm.tsx` | Ajouter une photo à la galerie (max 3) |
| `event-gallery-row` / `event-gallery-url` / `event-gallery-alt` | `event-creation/EventCreationForm.tsx` | Ligne photo de la galerie |
| `event-gallery-move-up` / `event-gallery-move-down` / `event-gallery-remove` | `event-creation/EventCreationForm.tsx` | Réordonnancement / suppression |
| `event-public-title` | `event-public/EventPublicView.tsx` | Titre de la page publique `/e/[slug]` |
| `event-public-buy` | `event-public/EventPublicView.tsx` | Bouton « Réserver maintenant » |
| `event-public-ticket-type` | `event-public/EventPublicView.tsx` | Ligne de tarif par type de billet |
| `event-public-share-whatsapp` / `event-public-share-copy` | `event-public/EventPublicView.tsx` | Partage WhatsApp / copie du lien |
| `event-public-gallery` / `event-public-gallery-slide` | `event-public/EventPublicView.tsx` | Carrousel (affiche + galerie) |
| `event-public-gallery-prev` / `event-public-gallery-next` / `event-public-gallery-dot` | `event-public/EventPublicView.tsx` | Navigation du carrousel |
| `event-detail-public-link` | `dashboard/EventDetail.tsx` | Lien « Page publique » (événement publié) |
| `upcoming-events` | `landing/LandingPage.tsx` | Bandeau « Événements à venir » (Phase 9) |
| `public-event-card` | `events/EventCard.tsx` | Carte « talon » d'un événement public |
| `listing-chip` / `listing-search` / `listing-sort` | `events/EventListing.tsx` | Filtres de la vitrine (Billetterie) |
| `listing-retry` / `listing-skeleton` / `listing-count` | `events/EventListing.tsx` | États chargement / erreur / compteur |
| `checkout-title` | `checkout/EventCheckout.tsx` | Titre de l'événement sur le tunnel |
| `checkout-type-option` | `checkout/EventCheckout.tsx` | Option de type de billet (radio) |
| `checkout-buyer-name` / `checkout-buyer-phone` / `checkout-buyer-email` | `checkout/EventCheckout.tsx` | Coordonnées acheteur |
| `checkout-total` / `checkout-quantity` / `checkout-submit` | `checkout/EventCheckout.tsx` | Total / quantité / soumission |
| `checkout-delivery-download` / `checkout-delivery-email` | `checkout/EventCheckout.tsx` | Choix de la remise (Phase 6.3) |
| `checkout-provider-mpesa` / `checkout-provider-orange` / `checkout-provider-airtel` | `checkout/EventCheckout.tsx` | Opérateur Mobile Money (Phase 6.4) |
| `paid-ticket-code` | `checkout/EventCheckout.tsx` | Code d'un billet émis après paiement |
| `paid-ticket` / `paid-ticket-qr` | `checkout/IssuedTicketCard.tsx` | Carte billet (QR + PDF/PNG/JPG) |
| `checkout-check-status` / `checkout-retry` | `checkout/EventCheckout.tsx` | Vérifier / réessayer le paiement |
| `checkout-success` | `checkout/EventCheckout.tsx` | Confirmation du paiement (billets) |
| `scanner-code-input`, `scan-result` | `scanner/Scanner.tsx` | Champ code / résultat |

## Ajouter un test

1. Créer `tests/e2e/<domaine>.spec.ts` (ou compléter un fichier existant).
2. Utiliser `goTo(page, 'NomDeLaVue')` depuis `helpers.ts` pour naviguer.
3. Si un élément est difficile à cibler, ajouter un `data-testid` dans le
   composant (en le documentant dans le tableau ci-dessus).
4. Si le test écrit en base, penser à nettoyer (création puis suppression).
5. Lancer `pnpm test:e2e` et vérifier que tout passe.

## Choix techniques

- **`workers: 1` (séries)** : les tests partagent une vraie base PostgreSQL ;
  l'exécution en série garantit la déterminisme (aucune interférence d'état).
- **Seed en `globalSetup`** : `scripts/seed-demo.mts --reset` redonne un état
  connu (2 événements, 12 billets, 10 scans) à chaque lancement.
- **Chromium uniquement** pour l'instant : Firefox et WebKit sont disponibles
  (déjà installés), décommenter les projets dans `playwright.config.ts` pour
  élargir la matrice.
- **`corepack pnpm dev`** dans `webServer` : résout `pnpm` via Corepack (fourni
  avec Node.js 20+) quel que soit l'environnement.

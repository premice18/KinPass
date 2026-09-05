# KPay — Guide d'intégration kinPass

> Document d'exploitation pour « moi du futur » : configuration des clés
> (test → production), des webhooks sur le dashboard KPay, et rappels de
> sécurité. Source technique complète : `kpay-context-node.md` (doc KPay)
> et le code dans `lib/kpay.ts`, `lib/payments.ts`, `lib/kpay-providers.ts`,
> `app/api/kpay/webhook/route.ts`.

---

## 1. Modèle mental (30 secondes)

- **Une seule URL d'API** : `https://admin.kpay.site` — en test comme en prod.
  C'est le **préfixe de la clé** qui sélectionne l'environnement :
  - test : `KPAY_API_KEY=kpay_test_…` / `KPAY_SECRET_KEY=sk_test_…` (argent fictif)
  - prod : `kpay_live_…` / `sk_live_…` (argent réel, **débloquées après validation KYC**)
- Les clés ne transitent **jamais** côté client (serveur → serveur uniquement).
- En RDC (COD), les opérateurs encaissables : `VODACOM_MPESA_COD`,
  `ORANGE_COD`, `AIRTEL_COD` (définis dans `lib/kpay-providers.ts`).
- **Sans clés KPay dans l'environnement**, le checkout bascule automatiquement
  en mode « Simuler le paiement » (démo/E2E) — aucune clé requise pour développer.

---

## 2. Mode TEST — configuration

### 2.1 Variables d'environnement (`.env.local` / Vercel Preview)

```bash
KPAY_API_KEY="kpay_test_xxxxxxxxxxxxxxxx"
KPAY_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxx"
KPAY_WEBHOOK_SECRET="(coller le Secret Webhook du dashboard)"
KPAY_USD_CDF_RATE="2800"
```

Où les trouver sur le dashboard KPay (application de test) :
- `KPAY_API_KEY` / `KPAY_SECRET_KEY` : section **Clés API** de l'application.
- `KPAY_WEBHOOK_SECRET` : section **Webhooks → Secret Webhook** (bouton Régénérer).

### 2.2 Dashboard KPay → Webhooks (ce qu'il faut remplir)

| Champ du dashboard          | Valeur à mettre (TEST)                                              | Rôle |
| --------------------------- | ------------------------------------------------------------------- | ---- |
| Callback **générique**      | *(vide)*                                                            | secours non utilisé |
| Callback **dépôts**         | `https://<ton-tunnel-ngrok>.ngrok.app/api/kpay/webhook`             | ✅ notifications de paiement entrant |
| Callback **retraits**       | *(vide)* — à ajouter en Phase 10 (reversements organisateurs)       | `payout.*` |
| Callback **remboursements** | *(vide)*                                                            | `refund.*` (pas encore dans l'app) |
| **Secret Webhook**          | copier → `KPAY_WEBHOOK_SECRET`                                      | signature `X-KPAY-Signature` |

> En local, KPay doit pouvoir joindre ta machine : lance un tunnel public
> (ngrok / cloudflared) vers le port 3000 et utilise son URL HTTPS.
> Sans URL configurée, KPay **n'envoie aucune notification** → la commande
> reste `pending`.

### 2.3 Numéros de test RD Congo (sandbox)

| Numéro (saisir au checkout) | Résultat paiement            |
| --------------------------- | ---------------------------- |
| `+243 81 345 6789` → `243813456789` | ✅ `COMPLETED` (réussi) |
| `+243 81 345 6129` → `243813456129` | ⏳ `SUBMITTED` (reste en attente — tester le polling) |
| `+243 81 345 6019` | ❌ `FAILED` (limite payeur) |
| `+243 81 345 6029` | ❌ `FAILED` (payeur introuvable) |
| `+243 81 345 6039` | ❌ `FAILED` (refus) |
| `+243 81 345 6049` | ❌ `FAILED` (solde insuffisant) |

### 2.4 Vérifier que tout fonctionne (checklist test)

1. `pnpm dev` + tunnel ngrok actif.
2. Checkout `/e/kin-house-open-studio/checkout` → type VIP, quantité 1,
   opérateur M-Pesa, numéro `+243 81 345 6789` → « Validez le paiement ».
3. Le poll auto (3 s) doit passer à **« Paiement confirmé »** avec le code du billet.
4. En base : `orders.status = paid`, `payment_ref` renseigné, `tickets` créés,
   `ticket_types.sold_count` incrémenté.
5. Test du refus : numéro `…039` → écran « Paiement non abouti » + Réessayer.
6. Test de la signature : poster sur `/api/kpay/webhook` SANS en-tête
   `X-KPAY-Signature` → **401** (le webhook est rejeté).

---

## 3. Passage en PRODUCTION — checklist « moi du futur »

Quand le produit est prêt (KYC KPay validé, domaine `kinpass.app` déployé) :

### 3.1 Côté KPay (dashboard de production)

- [ ] Application **de production** créée / clés live générées (préfixe `kpay_live_` / `sk_live_`).
- [ ] Validation **KYC** effectuée (obligatoire pour débloquer le live).
- [ ] **Liste blanche des providers** : cocher au minimum `VODACOM_MPESA_COD`, `ORANGE_COD`, `AIRTEL_COD`.
- [ ] Webhooks → **Callback dépôts** : `https://kinpass.app/api/kpay/webhook`
      (retraits/remboursements : vides tant que les Phases 10/remboursements n'existent pas).
- [ ] **Secret Webhook** de production copié (≠ celui de test) — le régénérer si doute.
- [ ] Décider si le **paiement bancaire carte** (Visa/Mastercard) est activé sur la
      page de paiement KPay — si oui, vérifier ses URLs de retour propres au produit.
      (kinPass : inutile tant que la Phase 15.3 « diaspora » n'est pas construite.)

### 3.2 Côté kinPass (Vercel → Settings → Environment Variables)

- [ ] `KPAY_API_KEY="kpay_live_…"` et `KPAY_SECRET_KEY="sk_live_…"`.
- [ ] `KPAY_WEBHOOK_SECRET="<secret de production>"`.
- [ ] `KPAY_USD_CDF_RATE="<taux réel du jour>"` — ⚠️ le défaut 2800 est un taux
      figé pour le développement : **à remplacer par un vrai taux** (Phase 10 :
      taux dynamique + wallets multi-devises). Sans cela, chaque billet libellé
      en USD est facturé au taux codé en dur.
- [ ] `NEXT_PUBLIC_APP_URL="https://kinpass.app"` (déjà requis pour partage/SEO).
- [ ] `RESEND_API_KEY` si la remise des billets par email doit être réelle.

### 3.3 Smoke test final AVANT d'annoncer le lancement

- [ ] Achat réel d'1 billet avec un vrai numéro Mobile Money → commande `paid`,
      billet émis (code + PDF/QR), email reçu (si remise email).
- [ ] Refus/annulation → statut `failed`, écran « Réessayer » cohérent.
- [ ] Doublon de webhook (rejeu) → aucune commande re-traitée (idempotence).
- [ ] Vérifier dans le dashboard KPay le wallet crédité du montant net
      (commission KPay 5 % prélevée — le net crédité au wallet diffère du brut).

---

## 4. Rappels sécurité & pièges connus

- **Signature** : chaque webhook porte `X-KPAY-Signature` = HMAC-SHA256 hex du
  corps **brut** (jamais re-sérialisé) avec `KPAY_WEBHOOK_SECRET`. Vérifiée en
  temps constant dans `app/api/kpay/webhook/route.ts`. **En prod, ne JAMAIS
  laisser `KPAY_WEBHOOK_SECRET` vide** (en dev, l'absence de secret émet un
  avertissement et accepte — comportement démo uniquement).
- **Idempotence** : une même notification peut arriver plusieurs fois
  (réessais KPay : 3 tentatives, backoff 1 s/2 s/4 s, pas de réessai sur `4xx`).
  La commande `paid` n'est jamais re-traitée (`lib/payments.ts`).
- **Réponse rapide** : répondre `200` vite ; `500` déclenche les réessais KPay.
- **409 Conflict** : `externalId` déjà actif (notre `externalId` = id de la
  commande) — l'idempotence côté KPay évite les doubles initiations.
- **Devise** : `payments/init` n'a pas de paramètre devise ; KPay COD facture
  en CDF. Les billets USD sont convertis via `KPAY_USD_CDF_RATE` (défaut 2800).
  Le montant facturé affiché à l'acheteur est celui en CDF côté Mobile Money.
- **Limites** : 100 req/min (20/min passerelle, 60/min polling) — sur `429`,
  backoff exponentiel en respectant `Retry-After`.
- **Frais** : 5 % par paiement (dépôt) et 5 % par retrait — à intégrer à la
  stratégie de commission kinPass (Phase 10).

## 5. Fichiers de code liés

| Fichier | Rôle |
| --- | --- |
| `lib/kpay.ts` | Client API KPay serveur : `initKpayDeposit`, conversion CDF, normalisation numéro, `verifyKpayWebhookSignature`, `kpayConfigured()` |
| `lib/kpay-providers.ts` | Opérateurs Mobile Money RDC (choix du client au checkout) |
| `lib/payments.ts` | Traitement `pending → paid` : émission des billets (codes uniques), `sold_count`, email (partagé webhook + simulation) |
| `app/api/kpay/webhook/route.ts` | Endpoint webhook « Dépôts » (`payment.completed/failed/cancelled`) |
| `lib/actions/orders.ts` | `createOrder`, `initiatePayment` (KPay réel ou simulation), `getOrderStatus` |
| `components/features/checkout/EventCheckout.tsx` | Tunnel d'achat : opérateur, écrans awaiting/paid/failed, poll |

## 6. Liens utiles

- Dashboard KPay : `https://admin.kpay.site`
- Doc API complète embarquée : `kpay-context-node.md` (racine du projet)
- Env attendues : `.env.local.example` (copie → `.env.local`)

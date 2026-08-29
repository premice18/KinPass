# CAHIER DES CHARGES FONCTIONNEL ET TECHNIQUE DÉTAILLÉ

**Nom du projet :** Kin Pass

**Type de produit :** Plateforme SaaS Web (Billetterie et Contrôle d'accès)

**Marché cible :** Événementiel en République Démocratique du Congo (Kinshasa)

---

## 1. VISION GLOBALE ET OBJECTIFS DU PRODUIT

**Le Problème :**

L'organisation d'événements à Kinshasa (concerts, conférences, mariages, galas) souffre de failles structurelles : la circulation de faux billets physiques imprimés au noir, la gestion chaotique des listes d'invités sur des carnets ou des fichiers Excel non synchronisés, et les files d'attente interminables aux entrées.

**La Solution (Kin Pass) :**

Une application web unifiée, mobile-first, permettant de digitaliser l'ensemble du cycle de vie d'un événement :

1. **Création et vente** de billets en ligne sécurisés.
2. **Paiement local** via les passerelles Mobile Money (M-Pesa, Orange Money, Airtel Money).
3. **Contrôle d'accès ultra-rapide** à l'entrée de la salle grâce à un double mécanisme : Scanner de QR Code et saisie d'un code alphanumérique de secours à 6 caractères.

---

## 2. ARCHITECTURE DES RÔLES UTILISATEURS

La plateforme gère trois profils d'utilisateurs aux permissions distinctes :

- **L'Organisateur (Administrateur de l'événement) :** Crée et configure les événements, fixe les tarifs, suit les ventes en temps réel, exporte les listes d'invités et génère des accès pour ses équipes.
- **Le Participant / Acheteur :** Découvre l'événement via un lien de partage, sélectionne ses billets, effectue le paiement mobile, et récupère son billet numérique (contenant un QR code et un code à 6 caractères).
- **L'Agent de Contrôle (Sécurité / Hôtesse à la porte) :** Se connecte via une interface dédiée simplifiée pour scanner ou saisir manuellement les codes des billets à l'entrée de l'événement.

---

## 3. SPÉCIFICATIONS FONCTIONNELLES DÉTAILLÉES (MODULES)

### Module 1 : Authentification et Gestion des Comptes Organisateurs

- **Inscription / Connexion :** Inscription par email et mot de passe sécurisé (hashage via bcrypt).
- **Tableau de Bord Organisateur (Dashboard) :**
- _KPIs clés en temps réel :_ Chiffre d'affaires total généré (en USD / CDF), nombre total de billets vendus, taux de remplissage de la salle, et nombre de personnes déjà entrées (scannées).
- _Liste des événements :_ Affichage sous forme de cartes ou de tableau des événements passés, en cours et à venir, avec leur statut (Brouillon, Publié, Terminé).

### Module 2 : Création et Gestion des Événements

- **Formulaire de création d'événement :**
- _Informations générales :_ Titre de l'événement, description détaillée, catégorie (Concert, Conférence, Mariage, Soirée privée).
- _Localisation et Date :_ Lieu physique (ex: _Kintuadi Space, Lingwala_), date et heure de début, date et heure de fin.
- _Visuels :_ Téléchargement de l'affiche officielle de l'événement (stockée sur Supabase Storage ou Neon / Vercel Blob).
- _Paramétrage des Billets :_ Possibilité de créer plusieurs types de billets pour un même événement (ex: _Standard à 10$_, _VIP à 30$_, _Invitation gratuite_), avec pour chacun un stock/capacité limite.

### Module 3 : Tunnel d'Achat et Billetterie Publique (Front-Office)

- **Page Publique de l'Événement (`/e/[slug]`) :** Page épurée accessible via un lien unique à partager sur WhatsApp ou les réseaux sociaux. Affiche l'affiche, la description, les tarifs et un bouton d'achat direct.
- **Processus de Réservation :**
- Sélection de la quantité et du type de billet.
- Saisie des coordonnées de l'acheteur (Nom complet, Numéro de téléphone Mobile Money, Adresse email optionnelle).
- Validation et redirection vers le module de paiement.

- **Intégration Mobile Money :**
- Passerelle de paiement locale (ex: intégration API d'un agrégateur comme Maïsha Pay, Kpay ou flux de simulation pour le MVP).
- Confirmation instantanée du paiement par webhook ou retour de l'API de paiement.

- **Génération du Billet Numérique :**
- Dès validation du paiement, génération d'une page de confirmation et envoi du billet par SMS/WhatsApp (ou affichage direct).
- _Contenu visuel du billet :_ Nom de l'acheteur, type de billet, nom de l'événement, un **QR Code dynamique**, et un **Code Alphanumérique unique de 6 caractères** (ex: `K9M-4X2`) affiché en gros caractères gras pour une lecture humaine immédiate.

### Module 4 : Le Module de Contrôle d'Accès à la Porte (Scanner & Fallback)

- _C'est la brique critique du produit, pensée pour résister aux conditions du terrain à Kinshasa._
- **Accès Sécurisé de l'Agent :** L'agent accède à une URL dédiée au contrôle (ex: `/scan/mon-evenement`) et entre un code PIN unique fourni par l'organisateur.
- **Double Interface de Vérification :**

1. _Mode Caméra (QR Code) :_ Utilisation de la caméra du smartphone pour scanner instantanément le QR code du participant.
2. _Mode Manuel (Code à 6 caractères) :_ Un champ de saisie proéminent placé juste sous la caméra. Permet de taper le code à 6 caractères (ex: `K9M4X2`) en cas d'écran de téléphone cassé, de reflet lumineux ou de panne de la caméra. Le système convertit automatiquement les saisies en majuscules et ignore les tirets.

- **Retours Visuels et Sonores instantanés :**
- **VERT (VALIDE) :** Le billet est authentique, n'a jamais été utilisé. Affiche le nom du participant et son type de billet. Un son de validation retentit.
- **ORANGE (DÉJÀ SCANNÉ) :** Le billet est valide mais a déjà servi. Affiche l'heure exacte du premier passage pour contrer les tentatives de revente ou de double entrée.
- **ROUGE (INVALIDE) :** Le code n'existe pas dans la base de données ou ne correspond pas à cet événement.

---

## 4. SPÉCIFICATIONS TECHNIQUES

- **Stack Technique :**
- _Framework :_ Next.js (App Router) pour regrouper front-end et back-end de manière performante.
- _Style :_ Tailwind CSS (Design épuré, teintes neutres et bleu vif institutionnel).
- _Base de données :_ Neon (PostgreSQL Serverless) pour une gestion ultra-rapide des requêtes de vérification.
- _ORM :_ Drizzle ORM ou Prisma pour structurer les tables (`users`, `events`, `ticket_types`, `tickets`, `scans`).
- _Bibliothèques clés :_ `html5-qrcode` ou `@zxing/library` pour le scan, `qrcode.react` pour la génération des QR codes.

- **Règles de Sécurité et Performance :**
- _Indexation :_ La colonne du code alphanumérique à 6 caractères et l'ID du billet dans la base de données PostgreSQL doivent être indexés (`UNIQUE`, `INDEX`) pour garantir une réponse de validation en moins de 500 millisecondes.
- _Sécurisation des routes API :_ Protection stricte des endpoints de modification d'événements et de validation des billets pour empêcher le piratage des entrées.

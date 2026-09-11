import type { Metadata } from 'next'

import { LegalPage } from '@/components/features/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — kinPass',
  description:
    'Politique de confidentialité de kinPass : données collectées, finalités, durées de conservation et droits des personnes (RDC).',
}

// Politique de Confidentialité (Phase 11.1).
export default function PrivacyPage() {
  return (
    <LegalPage current="privacy" eyebrow="Documents légaux" title="Politique de confidentialité">
      <p>
        kinPass accorde une importance particulière à la protection des données personnelles. Cette
        politique explique quelles données nous collectons, pourquoi, combien de temps nous les
        conservons et quels sont vos droits, dans le respect du droit congolais applicable à la
        protection des données.
      </p>

      <h2>1. Responsable du traitement</h2>
      <p>
        Le responsable du traitement est l’éditeur de la plateforme kinPass. Pour toute question
        relative à vos données : <a href="/legal/contact">page Contact</a> ou{' '}
        <strong>contact@premicekombozi.com</strong>.
      </p>

      <h2>2. Données collectées</h2>
      <h3>2.1 Comptes organisateurs et agents</h3>
      <ul>
        <li>Nom complet, adresse email, mot de passe (stocké <strong>haché</strong>, jamais en clair).</li>
        <li>Profil : photo (ou avatar), numéro WhatsApp, adresse/ville, bio, site web, réseaux sociaux.</li>
        <li>Comptes de reversement : opérateur, titulaire, numéro de compte Mobile Money.</li>
        <li>Pour la connexion Google (optionnelle) : identifiant du compte Google et photo de profil.</li>
      </ul>

      <h3>2.2 Commandes et billets</h3>
      <ul>
        <li>Nom de l’acheteur, téléphone Mobile Money, email (optionnel).</li>
        <li>Détail de la commande (type de billet, quantité, montant, devise, statut du paiement).</li>
        <li>Billets émis (code, QR), scans à l’entrée (heure, agent, résultat).</li>
      </ul>

      <h3>2.3 Données techniques</h3>
      <ul>
        <li>Journaux techniques nécessaires au fonctionnement et à la sécurité (connexion, erreurs).</li>
        <li>Mesure d’audience agrégée et anonymisée (Vercel Analytics).</li>
      </ul>

      <h2>3. Finalités du traitement</h2>
      <ul>
        <li>Création et gestion des comptes, authentification et sécurité.</li>
        <li>Émission, remise et contrôle des billets (QR/code de secours).</li>
        <li>Traitement des paiements Mobile Money et des reversements aux organisateurs.</li>
        <li>Communication de service (confirmation, billets, retraits, rappels si activés).</li>
        <li>Prévention de la fraude et respect de nos obligations légales.</li>
      </ul>

      <h2>4. Base légale</h2>
      <ul>
        <li>Exécution du contrat (compte, billetterie, paiements).</li>
        <li>Intérêt légitime (sécurité, prévention de la fraude, amélioration du service).</li>
        <li>Consentement (communications facultatives, newsletter — désinscription à tout moment).</li>
      </ul>

      <h2>5. Partage des données</h2>
      <p>Vos données ne sont jamais vendues. Elles peuvent être traitées par nos sous-traitants techniques :</p>
      <ul>
        <li><strong>Neon</strong> — hébergement de la base de données (PostgreSQL).</li>
        <li><strong>Vercel</strong> — hébergement de l’application.</li>
        <li><strong>KPay</strong> — agrégateur de paiement Mobile Money (dépôts et retraits).</li>
        <li><strong>Resend</strong> — envoi des emails transactionnels.</li>
      </ul>
      <p>
        L’organisateur a accès, pour son événement, aux données des billets qu’il vend (nom, contact
        de l’acheteur, statut d’entrée), dans le cadre de la gestion de son événement.
      </p>

      <h2>6. Durées de conservation</h2>
      <ul>
        <li>Données de compte : tant que le compte est actif, puis archivage limité aux obligations légales.</li>
        <li>Commandes, billets et scans : durée nécessaire à la gestion de l’événement et aux obligations comptables/fiscales.</li>
        <li>Journaux techniques : durée courte, proportionnée à la sécurité du service.</li>
      </ul>

      <h2>7. Vos droits</h2>
      <ul>
        <li>Accès, rectification et mise à jour de vos informations (directement dans « Mon profil »).</li>
        <li>Effacement, dans les limites des obligations légales (conservation comptable notamment).</li>
        <li>Opposition et limitation pour les traitements fondés sur l’intérêt légitime.</li>
        <li>Retrait du consentement à tout moment pour les communications facultatives.</li>
      </ul>
      <p>Pour exercer ces droits : <a href="/legal/contact">page Contact</a>.</p>

      <h2>8. Sécurité</h2>
      <p>
        Les mots de passe sont hachés (bcrypt), les sessions protégées par cookies signés, les
        paiements traités par un agrégateur agréé — <strong>aucune donnée bancaire complète ne
        transite ni n’est stockée par kinPass</strong>. Les échanges sont chiffrés (HTTPS).
      </p>

      <h2>9. Cookies</h2>
      <p>
        kinPass utilise uniquement des cookies <strong>strictement nécessaires</strong> (session,
        thème clair/sombre) et une mesure d’audience agrégée sans profilage publicitaire. Aucun
        cookie publicitaire tiers n’est utilisé.
      </p>

      <h2>10. Modifications</h2>
      <p>
        Cette politique peut évoluer ; la version applicable est celle publiée sur cette page, avec
        sa date de mise à jour.
      </p>
    </LegalPage>
  )
}


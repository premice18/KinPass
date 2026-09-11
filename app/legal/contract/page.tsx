import type { Metadata } from 'next'

import { LegalPage } from '@/components/features/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Contrat de prestation & règles de reversement — kinPass',
  description:
    'Contrat de prestation kinPass : commission, reversements aux organisateurs, responsabilités et gestion des annulations (RDC).',
}

// Contrat de prestation & règles de reversement (Phase 11.1).
// NB : ce document fige les TERMES FINANCIERS (commission, retrait à la
// demande) qui font référence pour l’implémentation de la monétisation
// (Phase 10 fusionnée dans la 16).
export default function ContractPage() {
  return (
    <LegalPage current="contract" eyebrow="Documents légaux" title="Contrat de prestation & règles de reversement">
      <p>
        Ce contrat encadre la prestation de services de billetterie fournie par kinPass aux
        organisateurs d’événements, ainsi que les règles de reversement des revenus encaissés. Il
        complète les <a href="/legal/cgu">CGU</a>.
      </p>

      <h2>1. Objet de la prestation</h2>
      <p>
        kinPass met à disposition une plateforme permettant de : publier une page d’événement,
        vendre des billets numériques, encaisser des paiements Mobile Money, émettre des billets
        (QR + code de secours), contrôler les entrées et suivre les ventes en temps réel.
      </p>

      <h2>2. Commission kinPass</h2>
      <ul>
        <li>kinPass prélève une <strong>commission de 0,3 %</strong> sur le montant brut de chaque billet vendu (constante technique `KINPASS_FEE_PERCENT`, susceptible d’évoluer avec information préalable).</li>
        <li>La commission est affichée dans le tableau de bord et déduite au moment du retrait.</li>
        <li>Les <strong>événements à entrée libre</strong> (prix à 0) ne génèrent aucune commission (0 × taux = 0).</li>
        <li>Les frais des opérateurs Mobile Money et de l’agrégateur de paiement sont distincts de la commission kinPass et peuvent s’appliquer aux dépôts et aux retraits.</li>
      </ul>

      <h2>3. Encaissement des ventes</h2>
      <ul>
        <li>Les paiements des acheteurs sont encaissés via l’agrégateur KPay sur le wallet kinPass.</li>
        <li>Une commande n’est considérée payée qu’après confirmation par l’agrégateur (webhook signé).</li>
        <li>Les billets ne sont émis qu’après confirmation du paiement.</li>
      </ul>

      <h2>4. Reversement des revenus (retrait à la demande)</h2>
      <ul>
        <li>L’organisateur peut demander un <strong>retrait à tout moment</strong> depuis son tableau de bord, vers l’un des comptes de reversement qu’il a configurés (M-Pesa, Orange Money, Airtel Money, virement).</li>
        <li><strong>Montant minimum de retrait : 25 $</strong> (ou l’équivalent dans la devise concernée).</li>
        <li>Un <strong>seul retrait en cours</strong> à la fois ; le solde disponible est calculé sur les commandes effectivement payées, diminué des retraits déjà demandés.</li>
        <li>Le délai de traitement cible est de <strong>24 à 72 heures ouvrées</strong>, sous réserve de la disponibilité des opérateurs.</li>
        <li>Le montant net versé est égal au montant demandé, diminué de la commission kinPass et, le cas échéant, des frais de l’opérateur de paiement, affichés avant validation.</li>
      </ul>

      <h2>5. Obligations de l’organisateur</h2>
      <ul>
        <li>Décrire son événement de manière exacte (dates, lieu, capacité, prix) et respecter la réglementation locale.</li>
        <li>Honorer les billets vendus et assurer le contrôle d’accès avec des agents formés.</li>
        <li>Définir et communiquer sa politique d’annulation et de remboursement aux acheteurs.</li>
        <li>Ne pas utiliser la plateforme pour des activités illicites ou frauduleuses.</li>
      </ul>

      <h2>6. Annulations, reports et remboursements</h2>
      <ul>
        <li>En cas d’annulation ou de report, l’organisateur en informe les acheteurs et procède aux remboursements selon sa politique.</li>
        <li>kinPass peut fournir les listes d’acheteurs et la traçabilité des commandes pour faciliter ces opérations.</li>
        <li>La commission kinPass sur des billets remboursés peut faire l’objet d’un avoir ou d’un ajustement sur demande.</li>
      </ul>

      <h2>7. Suspension et résiliation</h2>
      <ul>
        <li>kinPass peut suspendre un compte en cas de fraude, d’impayé avéré ou de manquement grave, après information lorsque la situation le permet.</li>
        <li>L’organisateur peut cesser d’utiliser la plateforme à tout moment ; les soldes disponibles restent retirables selon les présentes règles.</li>
      </ul>

      <h2>8. Responsabilités</h2>
      <ul>
        <li>kinPass est tenu à une obligation de moyens sur la disponibilité et la sécurité du service.</li>
        <li>kinPass n’est pas responsable du déroulement de l’événement ni des interruptions des réseaux ou opérateurs.</li>
        <li>La responsabilité de kinPass est limitée, dans toute la mesure permise par la loi, au montant des commissions perçues sur les ventes concernées.</li>
      </ul>

      <h2>9. Données et confidentialité</h2>
      <p>
        Les traitements de données liés à la prestation sont décrits dans la{' '}
        <a href="/legal/privacy">Politique de confidentialité</a>. L’organisateur accède uniquement
        aux données de ses propres événements.
      </p>

      <h2>10. Droit applicable</h2>
      <p>
        Le présent contrat est régi par le droit congolais. Tout litige sera d’abord examiné
        amiablement via la <a href="/legal/contact">page Contact</a>.
      </p>
    </LegalPage>
  )
}


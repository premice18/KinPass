import type { Metadata } from 'next'

import { LegalPage } from '@/components/features/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Conditions Générales d’Utilisation — kinPass',
  description:
    'Conditions générales d’utilisation de kinPass : billetterie numérique, paiement Mobile Money et contrôle d’accès en République démocratique du Congo.',
}

// Conditions Générales d'Utilisation (Phase 11.1).
// `?from=register` : affiche un retour vers l'inscription (l'utilisateur a
// ouvert ce document depuis la case d'acceptation).
export default async function CguPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>
}) {
  const { from } = await searchParams

  return (
    <LegalPage
      current="cgu"
      eyebrow="Documents légaux"
      title="Conditions Générales d’Utilisation"
      backHref={from === 'register' ? '/auth/register' : undefined}
      backLabel="Revenir à l’inscription"
    >
      <p>
        Les présentes Conditions Générales d’Utilisation (« CGU ») régissent l’accès et l’usage de la
        plateforme <strong>kinPass</strong>, service de billetterie numérique et de contrôle d’accès
        destiné aux événements organisés en République démocratique du Congo (« RDC »).
      </p>
      <p>
        En créant un compte ou en utilisant la plateforme, vous acceptez sans réserve les présentes
        CGU. Si vous n’acceptez pas ces conditions, n’utilisez pas le service.
      </p>

      <h2>1. Définitions</h2>
      <ul>
        <li><strong>Plateforme</strong> : le site et les services kinPass (billetterie, paiements, scan).</li>
        <li><strong>Organisateur</strong> : toute personne créant un compte pour vendre des billets d’un événement.</li>
        <li><strong>Acheteur</strong> : toute personne achetant un billet via la plateforme.</li>
        <li><strong>Agent de contrôle</strong> : compte dédié créé par un organisateur pour scanner les billets à l’entrée.</li>
        <li><strong>Billet numérique</strong> : titre d’accès comportant un QR code et un code alphanumérique de 6 caractères.</li>
      </ul>

      <h2>2. Comptes et rôles</h2>
      <ul>
        <li>La création d’un compte organisateur est <strong>gratuite</strong> et réservée aux personnes majeures capables.</li>
        <li>Vous vous engagez à fournir des informations exactes et à les tenir à jour (profil, coordonnées, comptes de reversement).</li>
        <li>Les comptes agents de contrôle sont créés <strong>uniquement</strong> par un organisateur ; ils donnent accès au seul scan des événements assignés, jamais aux ventes, revenus ou réglages.</li>
        <li>Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.</li>
      </ul>

      <h2>3. Utilisation de la plateforme</h2>
      <ul>
        <li>L’organisateur est seul responsable du contenu de son événement (titre, description, images, dates, lieu, capacité, prix) et du respect des autorisations locales nécessaires à sa tenue.</li>
        <li>Il est interdit d’utiliser la plateforme à des fins frauduleuses, de revendre des billets contrefaits ou de contourner les dispositifs de contrôle d’accès.</li>
        <li>kinPass peut suspendre tout compte en cas de fraude, d’abus ou de non-respect des présentes CGU.</li>
      </ul>

      <h2>4. Billets et contrôle d’accès</h2>
      <ul>
        <li>Chaque billet est unique (QR code + code de secours) et n’autorise qu’une seule entrée.</li>
        <li>L’organisateur peut refuser l’entrée d’un billet invalide, déjà utilisé, ou ne correspondant pas à l’événement.</li>
        <li>En cas de perte du billet, l’acheteur peut le retrouver via la page « Vérifier mon billet » ou contacter l’organisateur.</li>
      </ul>

      <h2>5. Paiements</h2>
      <ul>
        <li>Les paiements sont effectués via les opérateurs Mobile Money disponibles en RDC (M-Pesa, Orange Money, Airtel Money), par l’intermédiaire d’un agrégateur de paiement.</li>
        <li>Les frais appliqués par les opérateurs et l’agrégateur sont indiqués lors du paiement ou dans le contrat de prestation.</li>
        <li>La commission kinPass applicable aux organisateurs est précisée dans le <a href="/legal/contract">contrat de prestation</a> et affichée dans le tableau de bord.</li>
      </ul>

      <h2>6. Annulations et remboursements</h2>
      <ul>
        <li>L’organisation d’un remboursement relève de l’organisateur, qui définit sa politique d’annulation au moment de la vente.</li>
        <li>kinPass peut assister techniquement à la traçabilité des commandes, sans se substituer aux obligations de l’organisateur.</li>
      </ul>

      <h2>7. Responsabilités</h2>
      <ul>
        <li>kinPass fournit un service de billetterie « en l’état » et met en œuvre les moyens raisonnables pour assurer sa disponibilité et la sécurité des données.</li>
        <li>kinPass ne peut être tenu responsable de l’annulation, du report, de la modification ou du déroulement de l’événement, ni des interruptions imputables aux opérateurs de téléphonie, aux réseaux ou à des cas de force majeure.</li>
      </ul>

      <h2>8. Propriété intellectuelle</h2>
      <p>
        La marque, le logo, l’interface et les logiciels kinPass demeurent la propriété exclusive de
        leurs titulaires. L’organisateur conserve la propriété de ses contenus (textes, images) et
        concède à kinPass une licence limitée pour les afficher dans le cadre du service.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la <a href="/legal/privacy">Politique de
        confidentialité</a>, qui fait partie intégrante des présentes CGU.
      </p>

      <h2>10. Droit applicable et litiges</h2>
      <p>
        Les présentes CGU sont régies par le droit congolais. En cas de litige, les parties
        s’efforceront d’abord de trouver une solution amiable, notamment via la page{' '}
        <a href="/legal/contact">Contact</a>.
      </p>
    </LegalPage>
  )
}

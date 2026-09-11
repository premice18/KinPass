import type { Metadata } from 'next'

import { LegalPage } from '@/components/features/legal/LegalPage'

export const metadata: Metadata = {
  title: 'À propos — kinPass',
  description:
    'kinPass, la billetterie numérique pensée pour la République démocratique du Congo : mission, valeurs et contact.',
}

// Page À propos (Phase 11.1).
export default function AboutPage() {
  return (
    <LegalPage current="about" eyebrow="kinPass" title="À propos">
      <p>
        <strong>kinPass</strong> est né d’un constat simple : en République démocratique du Congo,
        la billetterie reste largement artisanale — billets papier, listes Excel, encaissements
        manuels — alors que le Mobile Money est partout dans les poches.
      </p>
      <p>
        Notre mission : donner aux organisateurs congolais un outil <strong>simple, fiable et
        local</strong> pour vendre leurs billets, encaisser en Mobile Money et contrôler les
        entrées — sans matériel spécial, sans friction, avec des frais maîtrisés.
      </p>

      <h2>Ce que fait kinPass</h2>
      <ul>
        <li>Une page publique par événement, partageable en un lien (WhatsApp, réseaux).</li>
        <li>La vente de billets numériques avec paiement M-Pesa, Orange Money et Airtel Money.</li>
        <li>Des billets avec QR code et code de secours à 6 caractères.</li>
        <li>Un contrôle d’accès dédié aux équipes de porte, avec suivi des entrées en direct.</li>
        <li>Des revenus reversés à la demande, avec une commission transparente.</li>
      </ul>

      <h2>Nos principes</h2>
      <ul>
        <li><strong>Local d’abord</strong> : Mobile Money, WhatsApp, réalités de terrain.</li>
        <li><strong>Simplicité</strong> : un organisateur doit pouvoir publier un événement en quelques minutes.</li>
        <li><strong>Transparence</strong> : commission claire, aucune surprise, données maîtrisées.</li>
        <li><strong>Sécurité</strong> : billets uniques, contrôle strict, traçabilité des scans.</li>
      </ul>

      <h2>Contact</h2>
      <p>
        Une question, un partenariat, une idée ? Écrivez-nous via la{' '}
        <a href="/legal/contact">page Contact</a> — nous répondons sous 24 à 48 heures ouvrées.
      </p>
    </LegalPage>
  )
}


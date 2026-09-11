import type { Metadata } from 'next'
import { Mail, Whatsapp } from 'iconoir-react'

import { LegalPage } from '@/components/features/legal/LegalPage'
import { ContactForm } from '@/components/features/legal/ContactForm'
import { DEFAULT_CONTACT_ADDRESS } from '@/lib/mail'

export const metadata: Metadata = {
  title: 'Contacter l’équipe kinPass',
  description:
    'Contactez l’équipe kinPass : question organisateur, problème de billet, partenariat — réponse sous 24 à 48 heures ouvrées.',
}

// Page Contact/Support (Phase 11.1) — un vrai contact humain.
// Adresse : MAIL_CONTACT (défaut contact@premicekombozi.com — seul domaine
// vérifié aujourd'hui ; basculera vers contact@kinpass.com à la vérification).
export default function ContactPage() {
  const contactAddress = process.env.MAIL_CONTACT ?? DEFAULT_CONTACT_ADDRESS

  return (
    <LegalPage current="contact" showAuthCta={false} eyebrow="Support" title="Contacter l’équipe kinPass">
      <p>
        Une question sur un événement, un billet, votre compte organisateur ou un partenariat ?
        Écrivez-nous — un membre de l’équipe vous répond directement, sous{' '}
        <strong>24 à 48 heures ouvrées</strong>.
      </p>

      {/* Coordonnées directes */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          <a href={`mailto:${contactAddress}`} className="font-medium text-primary underline-offset-4 hover:underline">
            {contactAddress}
          </a>
        </span>
        <span className="flex items-center gap-2 text-muted-foreground">
          <Whatsapp className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          WhatsApp d’assistance disponible sur demande par email
        </span>
      </div>

      {/* Formulaire (envoi → boîte kinPass, réponse directe à votre adresse) */}
      <div className="not-prose mt-8">
        <ContactForm />
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Les données transmises via ce formulaire servent uniquement à traiter votre demande (voir la{' '}
        <a href="/legal/privacy">Politique de confidentialité</a>).
      </p>
    </LegalPage>
  )
}


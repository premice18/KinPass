// Tests end-to-end du tunnel d'achat (Phase 6.2 → 6.4) — /e/[slug]/checkout.
//
// Sans clés KPay dans l'environnement de test, le checkout bascule en mode
// « Simuler le paiement » : la commande est payée immédiatement et les
// billets sont émis (codes 6 caractères) — mêmes règles que le webhook réel.
import { test, expect } from '@playwright/test'

// Slug de l'événement publié du seed (Kin House : Standard 10 $, VIP 50 $).
const PUBLISHED_SLUG = 'kin-house-open-studio'

test.describe('Tunnel d’achat /e/[slug]/checkout', () => {
  test('ouvre le tunnel depuis la page publique et choisit un billet', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}`)

    // CTA « Réserver maintenant » → vraie route checkout
    await page.getByTestId('event-public-buy').click()
    await page.waitForURL(/\/checkout$/)

    await expect(page.getByTestId('checkout-title')).toHaveText('Kin House : Open Studio')

    // Le type Standard (10 $) est proposé avec sa jauge réelle
    const standard = page.getByRole('radio', { name: /Standard/ })
    await expect(standard).toBeVisible()
    await standard.click()
    await expect(standard).toHaveAttribute('aria-checked', 'true')

    // L'opérateur M-Pesa est présélectionné ; Orange Money est proposé
    await expect(page.getByTestId('checkout-provider-mpesa')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('checkout-provider-orange').click()
    await expect(page.getByTestId('checkout-provider-orange')).toHaveAttribute('aria-checked', 'true')
  })

  test('calcule le total selon la quantité choisie', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}/checkout`)

    // Sélection du Standard à 10 $ puis quantité 2 -> total 20 $
    await page.getByRole('radio', { name: /Standard/ }).click()
    await expect(page.getByTestId('checkout-total')).toHaveText('10 $')

    await page.getByRole('button', { name: 'Augmenter la quantité' }).click()
    await expect(page.getByTestId('checkout-quantity')).toHaveText('2')
    await expect(page.getByTestId('checkout-total')).toHaveText('20 $')

    await page.getByRole('button', { name: 'Diminuer la quantité' }).click()
    await expect(page.getByTestId('checkout-quantity')).toHaveText('1')
    await expect(page.getByTestId('checkout-total')).toHaveText('10 $')
  })

  test('valide les coordonnées avant de créer la commande', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}/checkout`)

    await page.getByRole('radio', { name: /Standard/ }).click()
    // Nom trop court + téléphone invalide : blocage local
    await page.getByTestId('checkout-buyer-name').fill('J')
    await page.getByTestId('checkout-buyer-phone').fill('12')
    await page.getByTestId('checkout-submit').click()

    await expect(page.getByTestId('form-error')).toBeVisible()
    // Aucune commande n'a été créée (le formulaire est toujours là)
    await expect(page.getByTestId('checkout-submit')).toBeVisible()
  })

  test('paie (mode simulation) et affiche les billets émis', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}/checkout`)

    // 2 × VIP (50 $) = 100 $
    await page.getByRole('radio', { name: /VIP/ }).click()
    await page.getByRole('button', { name: 'Augmenter la quantité' }).click()
    await expect(page.getByTestId('checkout-total')).toHaveText('100 $')

    await page.getByTestId('checkout-buyer-name').fill('Jean-Marc Kabongo')
    await page.getByTestId('checkout-buyer-phone').fill('+243 81 234 56 78')
    await page.getByTestId('checkout-submit').click()

    // Confirmation du paiement + référence de commande
    const success = page.getByTestId('checkout-success')
    await expect(success).toBeVisible()
    await expect(success.getByText('Paiement confirmé')).toBeVisible()
    await expect(success).toContainText(/Votre commande [A-Z0-9]{8}/)

    // Deux billets émis (un par place), QR + code au format XXX-XXX
    const cards = success.getByTestId('paid-ticket')
    await expect(cards).toHaveCount(2)
    for (let i = 0; i < 2; i++) {
      await expect(cards.nth(i)).toContainText('VIP')
      await expect(cards.nth(i).getByTestId('paid-ticket-code')).toHaveText(/^[A-Z2-9]{3}-[A-Z2-9]{3}$/)
      await expect(cards.nth(i).getByTestId('paid-ticket-qr')).toBeVisible()
      // Téléchargements toujours proposés (PDF/PNG/JPG)
      await expect(cards.nth(i).getByRole('button', { name: 'PDF' })).toBeVisible()
      await expect(cards.nth(i).getByRole('button', { name: 'PNG' })).toBeVisible()
      await expect(cards.nth(i).getByRole('button', { name: 'JPG' })).toBeVisible()
    }

    // Mention du mode démo (simulation, aucune clé KPay)
    await expect(success.getByText(/Mode démo/)).toBeVisible()
  })

  test('exige l’email quand la remise choisie est l’envoi par email', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}/checkout`)

    await page.getByRole('radio', { name: /Standard/ }).click()
    await page.getByTestId('checkout-buyer-name').fill('Jean-Marc Kabongo')
    await page.getByTestId('checkout-buyer-phone').fill('+243 81 234 56 78')

    // Remise par email… sans adresse : blocage
    await page.getByTestId('checkout-delivery-email').click()
    await page.getByTestId('checkout-submit').click()
    await expect(page.getByTestId('form-error')).toContainText(
      'L’adresse email est obligatoire pour recevoir vos billets par email.',
    )

    // Avec l'adresse : la commande part avec la remise « email »
    await page.getByTestId('checkout-buyer-email').fill('jeanmarc@exemple.cd')
    await page.getByTestId('checkout-submit').click()

    const success = page.getByTestId('checkout-success')
    await expect(success).toBeVisible()
    await expect(success.getByText('Paiement confirmé')).toBeVisible()
    // Le téléchargement reste proposé même avec la remise « email »
    await expect(success).toContainText(/email/)
    await expect(success.getByTestId('paid-ticket').first().getByRole('button', { name: 'PDF' })).toBeVisible()
  })

  test('un événement gratuit est confirmé sans payer', async ({ page }) => {
    await page.goto('/e/expo-photo-gombe/checkout')

    await page.getByRole('radio', { name: /Entrée libre/ }).click()
    await page.getByTestId('checkout-buyer-name').fill('Jean-Marc Kabongo')
    await page.getByTestId('checkout-buyer-phone').fill('+243 81 234 56 78')
    await page.getByTestId('checkout-submit').click()

    const success = page.getByTestId('checkout-success')
    await expect(success.getByText('Paiement confirmé')).toBeVisible()
    await expect(success.getByTestId('paid-ticket')).toHaveCount(1)
  })

  test('un événement terminé ou inconnu n’a pas de billetterie', async ({ page }) => {
    await page.goto('/e/conference-tech-rdc/checkout')
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  })
})

// Tests end-to-end du tunnel d'achat (Phase 6.2) — route `/e/[slug]/checkout`.
//
// Le tunnel est réel : sélection du type de billet (jauge réelle), quantité,
// coordonnées acheteur, création d'une commande `pending` en base (prix et
// capacité re-vérifiés par la Server Action — jamais côté client). La
// confirmation de paiement (Mobile Money) et la remise du billet arrivent
// avec les Phases 6.3/6.4 ; le test vérifie donc l'écran « Commande
// enregistrée ».
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

  test('crée une commande pending et affiche l’accusé de réception', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}/checkout`)

    await page.getByRole('radio', { name: /VIP/ }).click()
    await page.getByTestId('checkout-buyer-name').fill('Jean-Marc Kabongo')
    await page.getByTestId('checkout-buyer-phone').fill('+243 81 234 56 78')
    await page.getByTestId('checkout-buyer-email').fill('jeanmarc@exemple.cd')
    await page.getByTestId('checkout-submit').click()

    // Accusé de réception de la commande
    const success = page.getByTestId('checkout-success')
    await expect(success).toBeVisible()
    await expect(success.getByText('Commande enregistrée')).toBeVisible()
    // Référence lisible (8 caractères) + récapitulatif VIP
    await expect(success.getByText(/[A-Z0-9]{8}/)).toBeVisible()
    await expect(success).toContainText('1 × VIP')
  })

  test('un événement terminé ou inconnu n’a pas de billetterie', async ({ page }) => {
    await page.goto('/e/conference-tech-rdc/checkout')
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  })
})

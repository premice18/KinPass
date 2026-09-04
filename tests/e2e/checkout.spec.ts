// Tests end-to-end du tunnel de réservation (maquette TicketCheckout).
//
// Depuis la Phase 9, la rubrique « Billetterie » du menu affiche la vitrine
// des événements ; le checkout maquette reste atteignable via le bouton
// « Réserver maintenant » d'une page publique /e/[slug] (en attendant le vrai
// checkout, Phase 6.2). Le mock garde son prix codé en dur (38 $), son
// paiement factice et son code de confirmation (A4B-8K9).
import { test, expect } from '@playwright/test'

// Slug de l'événement publié du seed (page publique, Phase 6.1).
const PUBLISHED_SLUG = 'kin-house-open-studio'

// Ouvre la page publique de l'événement puis lance le checkout (maquette).
async function openCheckout(page: import('@playwright/test').Page): Promise<void> {
  await page.goto(`/e/${PUBLISHED_SLUG}`)
  await page.getByTestId('event-public-buy').click()
  await expect(page.getByText('Réserver vos billets')).toBeVisible()
}

test.describe('Tunnel de réservation (maquette)', () => {
  test('affiche l’événement et le total initial', async ({ page }) => {
    await openCheckout(page)

    await expect(page.getByRole('heading', { name: 'Kin House : Open Studio' })).toBeVisible()
    await expect(page.getByTestId('checkout-total')).toHaveText('38 $')
  })

  test('met à jour le total selon la quantité choisie', async ({ page }) => {
    await openCheckout(page)

    // Augmentation : 2 billets -> 76 $
    await page.getByRole('button', { name: 'Augmenter la quantité' }).click()
    await expect(page.getByTestId('checkout-quantity')).toHaveText('2')
    await expect(page.getByTestId('checkout-total')).toHaveText('76 $')

    // Diminution : retour à 1 billet -> 38 $
    await page.getByRole('button', { name: 'Diminuer la quantité' }).click()
    await expect(page.getByTestId('checkout-quantity')).toHaveText('1')
    await expect(page.getByTestId('checkout-total')).toHaveText('38 $')
  })

  test('simule le paiement et affiche la confirmation avec le code', async ({ page }) => {
    await openCheckout(page)

    await page.getByLabel('Nom complet').fill('Jean-Marc K.')
    await page.getByLabel('Numéro de téléphone').fill('+243 81 000 00 00')

    await page.getByRole('button', { name: 'Payer via Mobile Money' }).click()

    // Écran de confirmation
    await expect(page.getByText('Billets confirmés')).toBeVisible()
    await expect(page.getByTestId('checkout-confirm-code')).toHaveText('A4B-8K9')

    // Retour au tunnel de réservation
    await page.getByRole('button', { name: 'Acheter un autre billet' }).click()
    await expect(page.getByText('Réserver vos billets')).toBeVisible()
  })
})

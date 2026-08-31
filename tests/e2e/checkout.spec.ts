// Tests end-to-end du tunnel de réservation (maquette TicketCheckout).
//
// Le checkout est encore une maquette : prix codé en dur (38 $), paiement
// factice, code de confirmation codé en dur (A4B-8K9). Les tests valident le
// comportement actuel de l'interface.
import { test, expect } from '@playwright/test'

import { goTo } from './helpers'

test.describe('Tunnel de réservation (maquette)', () => {
  test('affiche l’événement et le total initial', async ({ page }) => {
    await goTo(page, 'Billetterie')

    await expect(page.getByRole('heading', { name: 'Kin House : Open Studio' })).toBeVisible()
    await expect(page.getByText('Réserver vos billets')).toBeVisible()
    await expect(page.getByTestId('checkout-total')).toHaveText('38 $')
  })

  test('met à jour le total selon la quantité choisie', async ({ page }) => {
    await goTo(page, 'Billetterie')

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
    await goTo(page, 'Billetterie')

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

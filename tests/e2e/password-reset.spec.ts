// Tests end-to-end — Mot de passe oublié (Phase 11.5).
//
// Anti-énumération : la réponse est identique pour un email connu ou inconnu.
// Le lien invalide/expiré est refusé. (L'email est simulé sans clé Resend ;
// le flux complet token → reset est couvert par les tests unitaires.)
import { test, expect } from '@playwright/test'

test.describe('Mot de passe oublié (Phase 11.5)', () => {
  test('répond le même message pour un email inconnu (anti-énumération)', async ({ page }) => {
    await page.goto('/auth/forgot-password')

    await page.getByTestId('forgot-email').fill('inconnu-xyz@exemple.cd')
    await page.getByTestId('forgot-submit').click()

    const success = page.getByTestId('forgot-success')
    await expect(success).toBeVisible()
    await expect(success).toContainText('Si un compte existe pour cette adresse')
  })

  test('répond le même message pour un email connu (compte démo)', async ({ page }) => {
    await page.goto('/auth/forgot-password')

    await page.getByTestId('forgot-email').fill('organisateur@kinpass.test')
    await page.getByTestId('forgot-submit').click()

    const success = page.getByTestId('forgot-success')
    await expect(success).toBeVisible()
    await expect(success).toContainText('Si un compte existe pour cette adresse')
  })

  test('refuse un lien de réinitialisation invalide', async ({ page }) => {
    await page.goto('/auth/reset-password?token=token-bidon-invalide')
    await page.getByTestId('reset-password').fill('Nouveau@2026')
    await page.getByTestId('reset-confirm').fill('Nouveau@2026')
    await page.getByTestId('reset-submit').click()
    await expect(page.getByRole('alert')).toContainText('Lien invalide ou expiré')
  })

  test('affiche un lien invalide quand le token est absent', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByRole('heading', { name: 'Lien invalide' })).toBeVisible()
  })
})

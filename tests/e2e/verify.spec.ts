// Tests end-to-end — Vérification publique d'un billet (Phase 12).
//
// Codes du seed : KP0001 = billet utilisé (8 premiers), KP0010 = billet valide
// (2 derniers Standard). KP0009 n'est PAS utilisé ici (consommé par le flux
// agent). Un code inconnu renvoie le même écran « introuvable » (anti-énumération).
import { test, expect } from '@playwright/test'

test.describe('Vérification de billet /verify (Phase 12)', () => {
  test('billet valide : VERT + téléchargements + renvoi email', async ({ page }) => {
    await page.goto('/verify')

    await page.getByTestId('verify-code-input').fill('kp0010') // minuscules → normalisées
    await page.getByTestId('verify-submit').click()

    await expect(page.getByTestId('verify-valid-icon')).toBeVisible()
    await expect(page.getByText('Billet valide')).toBeVisible()
    await expect(page.getByText('Kin House : Open Studio')).toBeVisible()

    // Téléchargement PDF (route serveur existante)
    const downloadPromise = page.waitForEvent('download')
    await page.getByTestId('verify-download-pdf').click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/kinpass-KP0010\.pdf/)

    // Renvoi par email → réponse générique
    await page.getByTestId('verify-resend-email').fill('acheteur@exemple.cd')
    await page.getByTestId('verify-resend-submit').click()
    await expect(page.getByTestId('verify-resend-message')).toContainText('Si ce billet existe')
  })

  test('billet déjà utilisé : ORANGE avec l’heure du premier passage', async ({ page }) => {
    await page.goto('/verify')

    await page.getByTestId('verify-code-input').fill('KP0001')
    await page.getByTestId('verify-submit').click()

    await expect(page.getByTestId('verify-used-icon')).toBeVisible()
    await expect(page.getByText('Billet déjà utilisé')).toBeVisible()
    await expect(page.getByText(/Première entrée/)).toBeVisible()
  })

  test('code inconnu : ROUGE (même écran que « étranger »)', async ({ page }) => {
    await page.goto('/verify')

    await page.getByTestId('verify-code-input').fill('ZZZZZZ')
    await page.getByTestId('verify-submit').click()

    await expect(page.getByTestId('verify-unknown-icon')).toBeVisible()
    await expect(page.getByText('Billet introuvable')).toBeVisible()
  })

  test('la page événement expose « Vérifier mon billet »', async ({ page }) => {
    await page.goto('/e/kin-house-open-studio')
    await expect(page.getByRole('link', { name: 'Vérifier mon billet' })).toHaveAttribute('href', '/verify')
  })
})

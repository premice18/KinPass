// Tests end-to-end — pages légales & contact (Phase 11.1).
import { test, expect } from '@playwright/test'

test.describe('Pages légales (Phase 11.1)', () => {
  test('le footer de la landing expose les documents clés (sans le contrat)', async ({ page }) => {
    await page.goto('/')
    const footer = page.getByRole('navigation', { name: 'Liens légaux' })
    await expect(footer.getByRole('link', { name: 'Conditions d’utilisation' })).toHaveAttribute('href', '/legal/cgu')
    await expect(footer.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', '/legal/privacy')
    await expect(footer.getByRole('link', { name: 'À propos' })).toHaveAttribute('href', '/legal/about')
    await expect(footer.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/legal/contact')
    // Le contrat de reversement n'est pas exposé aux visiteurs (liens
    // organisateur uniquement — décision « consentement au bon moment »).
    await expect(footer.getByRole('link', { name: /reversement/i })).toHaveCount(0)
  })

  test('chaque document s’affiche avec le menu latéral (état actif)', async ({ page }) => {
    for (const [path, title, slug] of [
      ['/legal/cgu', 'Conditions Générales d’Utilisation', 'cgu'],
      ['/legal/privacy', 'Politique de confidentialité', 'privacy'],
      ['/legal/contract', 'Contrat de prestation & règles de reversement', 'contract'],
      ['/legal/about', 'À propos', 'about'],
      ['/legal/contact', 'Contacter l’équipe kinPass', 'contact'],
    ] as const) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      // Menu de navigation entre documents + état actif du document courant
      const menu = page.getByRole('navigation', { name: 'Documents légaux' }).first()
      await expect(menu.getByRole('link', { name: 'Conditions d’utilisation' })).toBeVisible()
      await expect(page.locator(`a[aria-current="page"][href="/legal/${slug}"]`).first()).toBeVisible()
      // Le contrat de reversement n'est PAS exposé dans le menu visiteur
      await expect(menu.getByRole('link', { name: /reversement/i })).toHaveCount(0)
    }
  })

  test('les documents portent un CTA final (sauf Contact)', async ({ page }) => {
    await page.goto('/legal/cgu')
    await expect(page.getByTestId('legal-cta-register')).toHaveAttribute('href', '/auth/register')
    await page.goto('/legal/contract')
    await expect(page.getByTestId('legal-cta')).toBeVisible()
    await page.goto('/legal/contact')
    await expect(page.getByTestId('legal-cta')).toHaveCount(0)
  })

  test('depuis l’inscription, le document propose « Revenir à l’inscription »', async ({ page }) => {
    await page.goto('/legal/cgu?from=register')
    const back = page.getByTestId('legal-back-link')
    await expect(back).toBeVisible()
    await expect(back).toHaveAttribute('href', '/auth/register')
  })

  test('le contrat affiche la commission et les règles de retrait', async ({ page }) => {
    await page.goto('/legal/contract')
    await expect(page.getByText(/commission de 0,3 %/)).toBeVisible()
    await expect(page.getByText(/Montant minimum de retrait : 25 \$/)).toBeVisible()
  })

  test('le formulaire de contact valide puis confirme l’envoi', async ({ page }) => {
    await page.goto('/legal/contact')

    // Message trop court → blocage serveur (validation Zod)
    await page.getByTestId('contact-name').fill('Test QA')
    await page.getByTestId('contact-email').fill('qa@exemple.cd')
    await page.getByTestId('contact-message').fill('court')
    await page.getByTestId('contact-submit').click()
    await expect(page.getByTestId('contact-error')).toBeVisible()

    // Message valide → envoi (simulé sans clé Resend en CI) puis accusé
    await page.getByTestId('contact-message').fill('Bonjour, ceci est un message de test suffisamment long.')
    await page.getByTestId('contact-submit').click()
    await expect(page.getByTestId('contact-success')).toBeVisible()
  })
})

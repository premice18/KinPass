// Tests end-to-end — Acceptation des règles de reversement (Phase 11.2).
//
// « Consentement au bon moment » : un NOUVEAU compte n'a accepté que la CGU
// (case d'inscription) ; le bandeau du dashboard l'invite à accepter les
// règles de reversement avant de publier. Le compte de démo du seed a déjà
// accepté (bandeau absent).
import { test, expect } from '@playwright/test'

test.describe('Acceptation des règles de reversement (Phase 11.2)', () => {
  test('un nouveau compte accepte les règles depuis le tableau de bord', async ({ page }) => {
    const email = `contrat-${Date.now()}@exemple.cd`

    // ── 1. Inscription (une seule case : conditions d'utilisation) ──────────
    await page.goto('/auth/register')
    await page.getByLabel('Nom complet').fill('Test Contrat')
    await page.getByLabel('Adresse email').fill(email)
    await page.getByLabel('Mot de passe', { exact: true }).fill('Contrat@2026')
    await page.getByLabel('Confirmer le mot de passe').fill('Contrat@2026')
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Créer mon compte' }).click()

    // Après inscription → dashboard (coquille SPA)
    await page.waitForURL(/view=dashboard/, { timeout: 15000 })

    // ── 2. Mention de commission + bandeau d'acceptation ────────────────────
    await expect(page.getByTestId('commission-notice')).toContainText('0.3')
    const banner = page.getByTestId('contract-banner')
    await expect(banner).toBeVisible()
    await expect(banner.getByText(/minimum 25 \$/)).toBeVisible()

    // ── 3. Acceptation → bandeau disparu ────────────────────────────────────
    await page.getByTestId('contract-accept').click()
    await expect(banner).toHaveCount(0)
  })

  test('le compte de démo (seed) a déjà accepté : aucun bandeau', async ({ page }) => {
    // Connexion organisateur de démonstration
    await page.goto('/auth/login')
    await page.getByLabel('Adresse email').fill('organisateur@kinpass.test')
    await page.getByLabel('Mot de passe').fill('Demo@2026')
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL(/view=dashboard/, { timeout: 15000 })

    await expect(page.getByTestId('commission-notice')).toBeVisible()
    await expect(page.getByTestId('contract-banner')).toHaveCount(0)
  })
})

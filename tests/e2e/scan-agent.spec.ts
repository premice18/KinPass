// Tests end-to-end — Flux agent (Phase 7.2).
//
// Parcours réel : l'organisateur démo crée un agent assigné à « Kin House »,
// récupère ses identifiants affichés une seule fois, se déconnecte, puis se
// connecte EN TANT QU'AGENT : redirection vers /scan, événement assigné
// visible, blocage sur les routes organisateur. Nettoyage : retour
// organisateur + suppression de l'agent.
import { test, expect } from '@playwright/test'

import { goTo, loginAsDemo } from './helpers'

test.describe('Flux agent (Phase 7.2)', () => {
  test('un agent se connecte, voit ses événements et est bloqué hors du dashboard', async ({ page }) => {
    const agentName = `Agent flux ${Date.now()}`
    let agentEmail = ''
    let agentPassword = ''

    // ── 1. L'organisateur crée un agent assigné à « Kin House » ───────────
    await loginAsDemo(page)
    await page.goto('/')
    await goTo(page, 'Tableau de bord')
    await page.getByRole('button', { name: 'Gérer les scanneurs' }).click()

    await page.getByTestId('team-create-button').click()
    await page.getByTestId('team-create-name').fill(agentName)
    // Coche la 1re case : Kin House du seed (tri du dashboard = création)
    await page.getByTestId('team-create-event').first().check()
    await page.getByTestId('team-create-submit').click()

    // Identifiants affichés une seule fois → on les capture
    const creds = page.getByTestId('team-created-creds')
    await expect(creds).toBeVisible()
    agentEmail = (await creds.getByTestId('team-creds-email').innerText()).trim()
    agentPassword = (await creds.getByTestId('team-creds-password').innerText()).trim()
    expect(agentEmail).toMatch(/@kinpass\.com$/)
    expect(agentPassword).toMatch(/^[A-Z2-9]{8}$/)

    // ── 2. Déconnexion de l'organisateur ───────────────────────────────────
    await page.getByRole('button', { name: 'Se déconnecter' }).click()
    await page.waitForURL('/')

    // ── 3. Connexion EN TANT QU'AGENT → redirection /scan ──────────────────
    await page.goto('/auth/login')
    await page.getByLabel('Adresse email').fill(agentEmail)
    await page.getByLabel('Mot de passe').fill(agentPassword)
    await page.getByRole('button', { name: 'Se connecter' }).click()
    await page.waitForURL('/scan', { timeout: 15000 })

    // L'agent voit l'événement qui lui est assigné (mais pas les autres)
    await expect(page.getByRole('heading', { name: 'Mes événements' })).toBeVisible()
    const card = page.getByTestId('agent-event-card').filter({ hasText: 'Kin House : Open Studio' })
    await expect(card).toBeVisible()

    // ── 4. Blocages RBAC ───────────────────────────────────────────────────
    // Route organisateur → redirigé vers /scan
    await page.goto('/dashboard')
    await page.waitForURL('/scan')
    // /auth/* quand déjà connecté → /scan aussi (pas de page login pour un agent)
    await page.goto('/auth/login')
    await page.waitForURL('/scan')

    // ── 5. Nettoyage : retour organisateur + suppression ───────────────────
    await page.getByRole('button', { name: 'Déconnexion' }).click()
    await loginAsDemo(page)
    await page.goto('/')
    await goTo(page, 'Tableau de bord')
    await page.getByRole('button', { name: 'Gérer les scanneurs' }).click()

    const row = page.getByTestId('team-agent-row').filter({ hasText: agentName })
    await expect(row).toBeVisible()
    page.on('dialog', (dialog) => dialog.accept())
    await row.getByTestId('team-agent-delete').click()
    await expect(page.getByTestId('team-agent-row').filter({ hasText: agentName })).toHaveCount(0)
  })
})

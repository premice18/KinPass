// Tests end-to-end — Équipe / Scanneurs (Phase 7.1, RBAC agents).
//
// L'organisateur crée un agent (NOM seul — email et mot de passe générés
// automatiquement côté serveur, affichés une seule fois), l'assigne à un
// événement, le suspend/réactive, puis le supprime (nettoyage).
import { test, expect } from '@playwright/test'

import { goTo, loginAsDemo } from './helpers'

test.describe('Équipe / Scanneurs (Phase 7.1)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
    await page.goto('/')
    await goTo(page, 'Tableau de bord')
    await page.getByRole('button', { name: 'Gérer les scanneurs' }).click()
  })

  test('crée un agent : identifiants auto-générés et assignation', async ({ page }) => {
    const agentName = `Scanneur test ${Date.now()}`

    // Ouverture du formulaire + nom seul (jamais d'email ni de mot de passe)
    await page.getByTestId('team-create-button').click()
    await page.getByTestId('team-create-name').fill(agentName)
    await page.getByTestId('team-create-event').first().check()
    await page.getByTestId('team-create-submit').click()

    // Panneau de transmission : email @kinpass.com + mot de passe 8 car.
    const creds = page.getByTestId('team-created-creds')
    await expect(creds).toBeVisible()
    await expect(creds.getByTestId('team-creds-email')).toHaveText(/@kinpass\.com$/)
    await expect(creds.getByTestId('team-creds-password')).toHaveText(/^[A-Z2-9]{8}$/)

    // L'agent apparaît dans la liste, actif, assigné à l'événement coché
    const row = page.getByTestId('team-agent-row').filter({ hasText: agentName })
    await expect(row).toBeVisible()
    await expect(row.getByText('Actif')).toBeVisible()
    await expect(row.getByText('Kin House : Open Studio')).toBeVisible()

    // Nettoyage : suppression de l'agent de test
    page.on('dialog', (dialog) => dialog.accept())
    await row.getByTestId('team-agent-delete').click()
    await expect(page.getByTestId('team-agent-row').filter({ hasText: agentName })).toHaveCount(0)
  })

  test('suspend, réactive puis régénère le mot de passe', async ({ page }) => {
    const agentName = `Gestion test ${Date.now()}`

    await page.getByTestId('team-create-button').click()
    await page.getByTestId('team-create-name').fill(agentName)
    await page.getByTestId('team-create-submit').click()

    const row = page.getByTestId('team-agent-row').filter({ hasText: agentName })
    await expect(row).toBeVisible()

    // Suspension → badge « Suspendu » + bouton « Réactiver »
    await row.getByTestId('team-agent-deactivate').click()
    await expect(row.getByText('Suspendu')).toBeVisible()
    await expect(row.getByTestId('team-agent-activate')).toBeVisible()
    await row.getByTestId('team-agent-activate').click()
    await expect(row.getByText('Actif')).toBeVisible()

    // « Nouveau mot de passe » : généré et affiché une seule fois
    await row.getByTestId('team-agent-reset').click()
    await expect(row.getByTestId('team-reset-password')).toHaveText(/^[A-Z2-9]{8}$/)
    await row.getByTestId('team-reset-copy').click()

    // Nettoyage
    page.on('dialog', (dialog) => dialog.accept())
    await row.getByTestId('team-agent-delete').click()
    await expect(page.getByTestId('team-agent-row').filter({ hasText: agentName })).toHaveCount(0)
  })
})

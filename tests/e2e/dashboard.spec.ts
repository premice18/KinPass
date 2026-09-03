// Tests end-to-end du tableau de bord organisateur.
//
// Ces tests dépendent des données de démonstration (seed `--reset` exécuté en
// globalSetup) : l'événement « Kin House : Open Studio » (publié, 12 billets
// vendus, 10 scans) et « Conférence Tech RDC » (brouillon).
//
// Depuis la Phase 4.1 (auth), le dashboard exige une session organisateur :
// chaque test se connecte d'abord avec le compte de démonstration.
import { test, expect } from '@playwright/test'

import { goTo, loginAsDemo } from './helpers'

test.describe('Tableau de bord organisateur', () => {
  // Connexion, retour à l'accueil, puis navigation via le menu (goTo).
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page)
    await page.goto('/')
  })

  test('affiche les KPIs agrégés et la liste des événements', async ({ page }) => {
    await goTo(page, 'Tableau de bord')

    // KPIs calculés depuis les agrégations serveur (données du seed)
    await expect(page.getByTestId('kpi-revenue')).toContainText('200 $')
    await expect(page.getByTestId('kpi-sold')).toContainText('12')
    await expect(page.getByTestId('kpi-scanned')).toContainText('10')

    // Liste : au moins les deux événements du seed
    await expect(page.getByTestId('event-card').first()).toBeVisible()
    await expect(page.getByText('Kin House : Open Studio')).toBeVisible()
    await expect(page.getByText('Conférence Tech RDC')).toBeVisible()

    // Badges de statut
    await expect(
      page.getByTestId('event-card').filter({ hasText: 'Kin House : Open Studio' }).getByText('Publié'),
    ).toBeVisible()
    await expect(
      page.getByTestId('event-card').filter({ hasText: 'Conférence Tech RDC' }).getByText('Brouillon'),
    ).toBeVisible()
  })

  test('publie un événement brouillon', async ({ page }) => {
    await goTo(page, 'Tableau de bord')

    // Carte de l'événement brouillon « Conférence Tech RDC »
    const confCard = page.getByTestId('event-card').filter({ hasText: 'Conférence Tech RDC' })
    await expect(confCard.getByText('Brouillon')).toBeVisible()

    // Publication -> le badge passe à « Publié » et le bouton disparaît
    await confCard.getByRole('button', { name: 'Publier' }).click()
    await expect(confCard.getByText('Publié')).toBeVisible()
    await expect(confCard.getByRole('button', { name: 'Publier' })).toHaveCount(0)
  })
})

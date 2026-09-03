// Tests end-to-end de la landing page (route `/`).
//
// La landing est une maquette statique : ces tests vérifient les éléments
// marketing clés et la navigation vers les deux CTA principaux.
import { test, expect } from '@playwright/test'

import { goTo, loginAsDemo } from './helpers'

test.describe('Landing page', () => {
  test('affiche le titre, le badge et les fonctionnalités', async ({ page }) => {
    await page.goto('/')

    // H1 principal (Hero)
    await expect(
      page.getByRole('heading', { level: 1, name: /billetterie intelligente pour vos événements en RDC/i }),
    ).toBeVisible()

    // Badge de positionnement
    await expect(page.getByText('Billetterie sécurisée en RDC')).toBeVisible()

    // Les 3 fonctionnalités (section « Tout ce qu'il vous faut »)
    await expect(page.getByRole('heading', { name: 'Scan QR instantané' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Code de secours' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mobile Money' })).toBeVisible()
  })

  test('le CTA « Créer un événement » mène au tableau de bord', async ({ page }) => {
    // Le dashboard exige une session (Phase 4.1) : connexion préalable.
    await loginAsDemo(page)
    await page.goto('/')

    // CTA principal du hero -> vue dashboard (navigation par état)
    await page.getByRole('button', { name: 'Créer un événement' }).click()

    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible()
    await expect(page.getByText('ESPACE ORGANISATEUR')).toBeVisible()
  })

  test('le CTA « Voir un événement » mène au tunnel de réservation', async ({ page }) => {
    await page.goto('/')

    // CTA secondaire -> vue checkout
    await page.getByRole('button', { name: 'Voir un événement' }).click()

    await expect(page.getByRole('heading', { name: 'Kin House : Open Studio' })).toBeVisible()
    await expect(page.getByText('Réserver vos billets')).toBeVisible()
  })

  test('la navigation par le menu fonctionne', async ({ page }) => {
    await page.goto('/')

    // Le menu « Billetterie » et « Scanner » restent accessibles depuis l'accueil
    await goTo(page, 'Billetterie')
    await expect(page.getByText('Réserver vos billets')).toBeVisible()

    await goTo(page, 'Accueil')
    await expect(
      page.getByRole('heading', { level: 1, name: /billetterie intelligente pour vos événements en RDC/i }),
    ).toBeVisible()
  })
})

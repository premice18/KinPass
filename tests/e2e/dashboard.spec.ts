// Tests end-to-end du tableau de bord organisateur.
//
// Ces tests dépendent des données de démonstration (seed `--reset` exécuté en
// globalSetup) : « Kin House : Open Studio » (publié), « Festival Jazz
// Kinshasa » et « Expo Photo Gombe » (publiés, Phase 9) — 22 billets, 10
// scans — et « Conférence Tech RDC » (brouillon, utilisé par les autres specs
// : page publique 404). Le test de publication crée donc son PROPRE événement
// jetable pour ne pas altérer le brouillon du seed.
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

    // KPIs calculés depuis les agrégations serveur (données du seed :
    // Kin House 200 $ + Festival Jazz 250 $, 22 billets, 10 scans)
    await expect(page.getByTestId('kpi-revenue')).toContainText('450 $')
    await expect(page.getByTestId('kpi-sold')).toContainText('22')
    await expect(page.getByTestId('kpi-scanned')).toContainText('10')

    // Liste : les événements du seed (dont le brouillon conservé)
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

  test('partage un événement publié depuis la vue détail', async ({ page }) => {
    await goTo(page, 'Tableau de bord')

    // Vue détail de l'événement publié du seed
    await page.getByRole('button', { name: 'Voir le détail de Kin House : Open Studio' }).click()
    await expect(page.getByRole('heading', { name: 'Kin House : Open Studio' })).toBeVisible()

    // Panneau de partage (Phase 6.7) avec l'URL publique
    await page.getByTestId('event-detail-share-open').click()
    const sheet = page.getByTestId('share-sheet')
    await expect(sheet).toBeVisible()
    await expect(sheet.getByTestId('share-input')).toHaveValue(/\/e\/kin-house-open-studio$/)
  })

  test('publie un événement brouillon (jetable, sans toucher au seed)', async ({ page }) => {
    // Accepte la boîte de confirmation native de la suppression finale.
    page.on('dialog', (dialog) => dialog.accept())
    const baseTitle = `Soirée publication test ${Date.now()}`

    // ── 1. Création d'un brouillon minimal (type par défaut pré-rempli) ──
    await goTo(page, 'Créer')
    await page.getByTestId('event-title-input').fill(baseTitle)
    await page.getByTestId('submit-event-button').click()

    const card = page.getByTestId('event-card').filter({ hasText: baseTitle })
    await expect(card).toBeVisible()
    await expect(card.getByText('Brouillon')).toBeVisible()

    // ── 2. Publication : badge « Publié », bouton disparu ─────────────────
    await card.getByRole('button', { name: 'Publier' }).click()
    await expect(card.getByText('Publié')).toBeVisible()
    await expect(card.getByRole('button', { name: 'Publier' })).toHaveCount(0)

    // ── 3. Nettoyage : suppression de l'événement jetable ─────────────────
    await card.getByRole('button', { name: `Supprimer ${baseTitle}` }).click()
    await expect(page.getByTestId('event-card').filter({ hasText: baseTitle })).toHaveCount(0)
  })
})

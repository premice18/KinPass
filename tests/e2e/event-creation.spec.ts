// Tests end-to-end du formulaire de création / édition d'événement.
//
// Couvre : la validation côté client, le cycle de vie complet (création d'un
// événement avec plusieurs types de billets, édition, puis suppression avec
// confirmation). Les données sont nettoyées à la fin du test.
import { test, expect } from '@playwright/test'

import { goTo } from './helpers'

test.describe('Création / édition d’événement', () => {
  // Chaque test démarre sur l'accueil, puis navigue via le menu (goTo).
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('affiche une erreur de validation si le titre est trop court', async ({ page }) => {
    await goTo(page, 'Créer')

    // Titre trop court (< 3 caractères) : la validation locale doit bloquer.
    await page.getByTestId('event-title-input').fill('ab')
    await page.getByTestId('submit-event-button').click()

    await expect(page.getByTestId('form-error')).toContainText(
      'Le titre doit contenir au moins 3 caractères.',
    )
  })

  test('cycle de vie complet : création, édition, suppression', async ({ page }) => {
    // Titre unique (horodatage) pour éviter toute collision entre exécutions.
    const baseTitle = `Soirée test ${Date.now()}`
    const editedTitle = `${baseTitle} (édité)`

    // La suppression déclenche une boîte de confirmation native.
    page.on('dialog', (dialog) => dialog.accept())

    // ── 1. Création d'un événement avec deux types de billets ───────────────
    await goTo(page, 'Créer')
    await page.getByTestId('event-title-input').fill(baseTitle)
    await page.getByLabel('Catégorie').selectOption('Soirée privée')
    await page.getByLabel('Début de l’événement').fill('2026-12-01T19:00')
    await page.getByLabel('Fin de l’événement').fill('2026-12-01T23:00')
    await page.getByLabel('Lieu').fill('Lola ya Bonobo')

    // Type de billet n°1 (Standard, USD)
    await page.getByLabel('Nom').nth(0).fill('Standard')
    await page.getByLabel('Prix').nth(0).fill('20')
    await page.getByLabel('Capacité').nth(0).fill('100')

    // Type de billet n°2 (VIP, CDF) via le bouton « Ajouter un type »
    await page.getByTestId('add-ticket-type').click()
    await page.getByLabel('Nom').nth(1).fill('VIP')
    await page.getByLabel('Prix').nth(1).fill('50')
    await page.getByLabel('Devise').nth(1).selectOption('CDF')
    await page.getByLabel('Capacité').nth(1).fill('20')

    await page.getByTestId('submit-event-button').click()

    // Retour au tableau de bord : la carte apparaît avec le badge « Brouillon ».
    const card = page.getByTestId('event-card').filter({ hasText: baseTitle })
    await expect(card).toBeVisible()
    await expect(card.getByText('Brouillon')).toBeVisible()

    // ── 2. Édition : le formulaire est pré-rempli puis le titre est modifié ──
    await card.getByRole('button', { name: `Modifier ${baseTitle}` }).click()
    await expect(page.getByTestId('event-title-input')).toHaveValue(baseTitle)
    // Deux types de billets sont bien pré-remplis
    await expect(page.getByTestId('ticket-type-row')).toHaveCount(2)

    await page.getByTestId('event-title-input').fill(editedTitle)
    await page.getByTestId('submit-event-button').click()

    await expect(
      page.getByTestId('event-card').filter({ hasText: editedTitle }),
    ).toBeVisible()

    // ── 3. Suppression avec confirmation ────────────────────────────────────
    await page
      .getByTestId('event-card')
      .filter({ hasText: editedTitle })
      .getByRole('button', { name: `Supprimer ${editedTitle}` })
      .click()

    await expect(
      page.getByTestId('event-card').filter({ hasText: editedTitle }),
    ).toHaveCount(0)
  })
})

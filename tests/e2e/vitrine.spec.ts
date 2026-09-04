// Tests end-to-end de la vitrine publique (Phase 9).
//
// - Landing : bandeau « Événements à venir » (3 événements publiés du seed,
//   jamais de brouillon).
// - Listing « Billetterie » : filtres en chips par catégorie, recherche par
//   titre, tri par date (croissant par défaut), navigation carte → page
//   publique /e/[slug], accessibilité clavier des chips.
//
// NB : ces tests reposent sur les événements publiés du seed (dates
// relatives au moment du seed → toujours « à venir »).
import { test, expect } from '@playwright/test'

import { goTo } from './helpers'

test.describe('Vitrine publique des événements', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('la landing masque les brouillons et montre les entrées libres', async ({ page }) => {
    // Le bandeau est sous le hero : Playwright défile automatiquement.
    const section = page.getByTestId('upcoming-events')
    await expect(section).toBeVisible()

    const cards = section.getByTestId('public-event-card')
    await expect(cards).toHaveCount(3)

    // L'événement gratuit (type à 0 $) porte le badge « Entrée libre ».
    const expoCard = cards.filter({ hasText: 'Expo Photo Gombe' })
    await expect(expoCard.getByText('Entrée libre')).toBeVisible()

    // Le brouillon du seed n'apparaît dans aucune carte publique.
    await expect(section.getByText('Conférence Tech RDC')).toHaveCount(0)
  })

  test('le listing affiche tous les événements publiés à venir', async ({ page }) => {
    await goTo(page, 'Billetterie')

    await expect(page.getByRole('heading', { name: 'Événements à venir' })).toBeVisible()

    const cards = page.getByTestId('public-event-card')
    await expect(cards).toHaveCount(3)
    await expect(cards.filter({ hasText: 'Kin House : Open Studio' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Festival Jazz Kinshasa' })).toBeVisible()
    await expect(cards.filter({ hasText: 'Expo Photo Gombe' })).toBeVisible()
    // Le brouillon reste invisible
    await expect(page.getByText('Conférence Tech RDC')).toHaveCount(0)
  })

  test('filtre par catégorie (chips)', async ({ page }) => {
    await goTo(page, 'Billetterie')
    const cards = page.getByTestId('public-event-card')

    // Chip « Festival » -> uniquement le Festival Jazz
    await page.getByTestId('listing-chip').filter({ hasText: 'Festival' }).click()
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Festival Jazz Kinshasa')

    // Chip « Concert » -> uniquement Kin House
    await page.getByTestId('listing-chip').filter({ hasText: 'Concert' }).click()
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Kin House : Open Studio')

    // « Tous » restaure les 3 événements
    await page.getByTestId('listing-chip').filter({ hasText: 'Tous' }).click()
    await expect(cards).toHaveCount(3)
  })

  test('recherche par titre', async ({ page }) => {
    await goTo(page, 'Billetterie')

    await page.getByTestId('listing-search').fill('Kin')
    const cards = page.getByTestId('public-event-card')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Kin House : Open Studio')

    // Recherche sans résultat -> état vide dédié
    await page.getByTestId('listing-search').fill('zzzz')
    await expect(page.getByRole('heading', { name: 'Aucun résultat' })).toBeVisible()
  })

  test('trie par date croissante puis décroissante', async ({ page }) => {
    await goTo(page, 'Billetterie')
    const cards = page.getByTestId('public-event-card')

    // Par défaut : dates croissantes (Kin House +9 j, Expo +30 j, Jazz +75 j)
    await expect(cards.first()).toContainText('Kin House : Open Studio')
    await expect(cards.last()).toContainText('Festival Jazz Kinshasa')

    // Tri décroissant : ordre inversé
    await page.getByTestId('listing-sort').selectOption('desc')
    await expect(cards.first()).toContainText('Festival Jazz Kinshasa')
    await expect(cards.last()).toContainText('Kin House : Open Studio')
  })

  test('une carte mène à la page publique /e/[slug]', async ({ page }) => {
    await goTo(page, 'Billetterie')

    const cardLink = page.getByRole('link', { name: 'Voir Expo Photo Gombe' })
    await expect(cardLink).toHaveAttribute('href', '/e/expo-photo-gombe')
    await cardLink.click()

    await expect(page.getByTestId('event-public-title')).toHaveText('Expo Photo Gombe')
  })

  test('les chips de filtre sont accessibles au clavier', async ({ page }) => {
    await goTo(page, 'Billetterie')

    // Focus clavier sur la chip « Concert » puis activation (Entrée)
    const concertChip = page.getByTestId('listing-chip').filter({ hasText: 'Concert' })
    await concertChip.focus()
    await expect(concertChip).toBeFocused()
    await page.keyboard.press('Enter')

    const cards = page.getByTestId('public-event-card')
    await expect(cards).toHaveCount(1)
    await expect(cards.first()).toContainText('Kin House : Open Studio')
  })
})

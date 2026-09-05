// Tests end-to-end de la landing page (route `/`).
//
// Depuis la Phase 9, la landing affiche le bandeau « Événements à venir »
// (événements PUBLIÉS du seed) et le CTA « Voir un événement » mène à la
// rubrique Billetterie (listing) — le checkout maquette est atteint depuis
// une page publique /e/[slug] (cf. checkout.spec.ts).
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

  test('affiche le bandeau des événements publiés à venir', async ({ page }) => {
    await page.goto('/')

    // Section « Événements à venir » (Phase 9.2)
    const section = page.getByTestId('upcoming-events')
    await expect(section).toBeVisible()

    // Les 3 événements publiés du seed apparaissent en cartes
    await expect(section.getByTestId('public-event-card')).toHaveCount(3)
    await expect(section.getByText('Kin House : Open Studio')).toBeVisible()
    await expect(section.getByText('Festival Jazz Kinshasa')).toBeVisible()
    await expect(section.getByText('Expo Photo Gombe')).toBeVisible()

    // Le brouillon du seed n'apparaît JAMAIS publiquement
    await expect(section.getByText('Conférence Tech RDC')).toHaveCount(0)

    // « Entrée libre » sur l'événement gratuit (données réelles)
    await expect(section.getByTestId('public-event-card').filter({ hasText: 'Expo Photo Gombe' }).getByText('Entrée libre')).toBeVisible()
  })

  test('le CTA « Créer un événement » guide un visiteur non connecté', async ({ page }) => {
    await page.goto('/')

    // Non connecté : pas de dashboard (erreur), mais la page de valeur
    // « Pour les organisateurs » qui mène à l'inscription.
    await page.getByRole('button', { name: 'Créer un événement' }).click()

    await expect(
      page.getByRole('heading', { name: 'Vendez et contrôlez vos billets, simplement.' }),
    ).toBeVisible()
    const register = page.getByTestId('organizer-intro-register')
    await expect(register).toHaveAttribute('href', '/auth/register')
    await expect(page.getByText(/Inscription gratuite/)).toBeVisible()
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

  test('le CTA « Voir un événement » mène à la rubrique Billetterie', async ({ page }) => {
    await page.goto('/')

    // CTA secondaire -> listing des événements à venir (Phase 9.3)
    await page.getByRole('button', { name: 'Voir un événement' }).click()

    await expect(page.getByRole('heading', { name: 'Événements à venir' })).toBeVisible()
    await expect(page.getByTestId('public-event-card').first()).toBeVisible()
  })

  test('la navigation par le menu fonctionne', async ({ page }) => {
    await page.goto('/')

    // Le menu « Billetterie » mène à la vitrine des événements (Phase 9)
    await goTo(page, 'Billetterie')
    await expect(page.getByRole('heading', { name: 'Événements à venir' })).toBeVisible()

    await goTo(page, 'Accueil')
    await expect(
      page.getByRole('heading', { level: 1, name: /billetterie intelligente pour vos événements en RDC/i }),
    ).toBeVisible()
  })
})

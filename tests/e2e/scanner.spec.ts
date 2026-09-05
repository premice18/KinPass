// Tests end-to-end des rubriques du menu pour les VISITEURS non connectés.
//
// Depuis la refonte du menu (rôles) : « Tableau de bord », « Créer » et
// « Scanner » ne sont plus des cul-de-sac pour un visiteur — ils mènent à des
// pages d'explication qui présentent le compte organisateur (inscription
// ~30 s) ou le futur outil de scan des agents (Phase 7).
import { test, expect } from '@playwright/test'

import { goTo, loginAsDemo } from './helpers'

test.describe('Rubriques du menu selon le rôle', () => {
  test('un visiteur qui clique « Tableau de bord » voit la page d’explication', async ({ page }) => {
    await page.goto('/')

    await goTo(page, 'Tableau de bord')
    await expect(
      page.getByRole('heading', { name: 'Vendez et contrôlez vos billets, simplement.' }),
    ).toBeVisible()
    await expect(page.getByTestId('organizer-intro-register')).toHaveAttribute('href', '/auth/register')
  })

  test('un visiteur qui clique « Créer » voit la même page d’explication', async ({ page }) => {
    await page.goto('/')

    await goTo(page, 'Créer')
    await expect(page.getByText('Inscription gratuite — environ 30 secondes, aucune carte requise')).toBeVisible()
  })

  test('un visiteur qui clique « Scanner » voit la page du contrôle d’accès', async ({ page }) => {
    await page.goto('/')

    await goTo(page, 'Scanner')
    await expect(
      page.getByRole('heading', { name: 'L’entrée de votre événement, sécurisée.' }),
    ).toBeVisible()
    await expect(page.getByText(/réservé aux agents de contrôle/)).toBeVisible()
    await expect(page.getByTestId('scanner-intro-register')).toHaveAttribute('href', '/auth/register')
  })

  test('un organisateur connecté accède directement à ses outils', async ({ page }) => {
    await loginAsDemo(page)
    await page.goto('/')

    // « Créer » ouvre le formulaire (et non la page d'explication).
    await goTo(page, 'Créer')
    await expect(page.getByRole('heading', { name: 'Créer un événement' })).toBeVisible()
  })
})

// Tests end-to-end de la page publique d'un événement (Phase 6.1).
//
// La route `/e/[slug]` est publique (aucune session). Elle affiche un
// événement PUBLIÉ (seed démo : « Kin House : Open Studio ») ; les brouillons
// et les slugs inconnus renvoient la 404 « Page introuvable ».
import { test, expect } from '@playwright/test'

// Slug de l'événement publié par le seed (scripts/seed-demo.mts).
const PUBLISHED_SLUG = 'kin-house-open-studio'
// Slug de l'événement brouillon du seed (doit rester invisible publiquement).
const DRAFT_SLUG = 'conference-tech-rdc'

test.describe('Page publique événement /e/[slug]', () => {
  test('affiche les informations d’un événement publié', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}`)

    // Titre + catégorie (en-tête sombre de la page).
    await expect(page.getByTestId('event-public-title')).toHaveText('Kin House : Open Studio')

    // Tarifs des types de billets (Standard 10 $, VIP 50 $ dans le seed).
    await expect(page.getByTestId('event-public-ticket-type')).toHaveCount(2)
    await expect(page.getByText('10 $').first()).toBeVisible()

    // Bouton d'achat présent (l'événement est publié et non terminé).
    await expect(page.getByTestId('event-public-buy')).toBeVisible()
  })

  test('affiche l’affiche et la galerie avec carrousel', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}`)

    // La « une » (affiche) est la 1re slide, suivie des 3 photos du seed.
    const gallery = page.getByTestId('event-public-gallery')
    await expect(gallery).toBeVisible()

    const slide = page.getByTestId('event-public-gallery-slide')
    await expect(slide).toHaveAttribute('alt', 'Affiche — Kin House : Open Studio')

    // Navigation « photo suivante » : on atteint la 1re photo de la galerie.
    await page.getByTestId('event-public-gallery-next').click()
    await expect(slide).toHaveAttribute('alt', 'Ateliers des artistes invités')

    // Navigation clavier (flèche gauche) pour revenir à l'affiche.
    await gallery.focus()
    await page.keyboard.press('ArrowLeft')
    await expect(slide).toHaveAttribute('alt', 'Affiche — Kin House : Open Studio')
  })

  test('ouvre le panneau de partage (lien, canaux, QR)', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}`)

    await page.getByTestId('event-public-share-open').click()

    const sheet = page.getByTestId('share-sheet')
    await expect(sheet).toBeVisible()
    // URL canonique correcte dans le champ en lecture seule
    await expect(sheet.getByTestId('share-input')).toHaveValue(/\/e\/kin-house-open-studio$/)
    // Canaux (WhatsApp pré-rempli avec le texte)
    const whatsapp = sheet.getByTestId('share-whatsapp')
    await expect(whatsapp).toHaveAttribute('href', /^https:\/\/wa\.me\/\?text=/)
    await expect(whatsapp).toHaveAttribute('href', /kin-house-open-studio/)
    await expect(sheet.getByTestId('share-telegram')).toBeVisible()
    await expect(sheet.getByTestId('share-x')).toBeVisible()
    await expect(sheet.getByTestId('share-facebook')).toBeVisible()
    // QR généré
    await expect(sheet.getByTestId('share-qr')).toBeVisible()

    // Fermeture par Échap
    await page.keyboard.press('Escape')
    await expect(sheet).toHaveCount(0)
  })

  test('le bouton d’achat mène au tunnel de réservation', async ({ page }) => {
    await page.goto(`/e/${PUBLISHED_SLUG}`)

    // CTA → vraie route de checkout (Phase 6.2)
    await page.getByTestId('event-public-buy').click()
    await page.waitForURL(/\/checkout$/)
    await expect(page.getByTestId('checkout-submit')).toBeVisible()
  })

  test('un événement brouillon reste introuvable (404)', async ({ page }) => {
    await page.goto(`/e/${DRAFT_SLUG}`)
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  })

  test('un slug inconnu renvoie la 404', async ({ page }) => {
    await page.goto('/e/evenement-qui-nexiste-pas')
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible()
  })
})

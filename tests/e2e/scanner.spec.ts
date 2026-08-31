// Tests end-to-end du contrôle d'accès (maquette Scanner).
//
// Le scanner est encore une maquette : les codes sont codés en dur
// (`A4B8K9` = valide, `X7PM3R` = déjà scanné). Les tests valident la
// normalisation (casse, tirets) et les trois états visuels.
import { test, expect } from '@playwright/test'

import { goTo } from './helpers'

test.describe('Contrôle d’accès (maquette scanner)', () => {
  test('affiche VALIDE pour un code reconnu', async ({ page }) => {
    await goTo(page, 'Scanner')

    await page.getByTestId('scanner-code-input').fill('A4B-8K9')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    await expect(page.getByTestId('scan-result')).toContainText('VALIDE')
    await expect(page.getByTestId('scan-result')).toContainText('Jean-Marc K.')
  })

  test('affiche DÉJÀ SCANNÉ pour un code déjà utilisé', async ({ page }) => {
    await goTo(page, 'Scanner')

    await page.getByTestId('scanner-code-input').fill('X7PM3R')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    await expect(page.getByTestId('scan-result')).toContainText('DÉJÀ SCANNÉ')
  })

  test('affiche INVALIDE pour un code inconnu', async ({ page }) => {
    await goTo(page, 'Scanner')

    await page.getByTestId('scanner-code-input').fill('ZZZZZZ')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    await expect(page.getByTestId('scan-result')).toContainText('INVALIDE')
  })

  test('ignore les tirets et la casse lors de la saisie', async ({ page }) => {
    await goTo(page, 'Scanner')

    // Saisie en minuscules sans tirets : la normalisation doit la rendre valide.
    await page.getByTestId('scanner-code-input').fill('a4b8k9')
    await page.getByRole('button', { name: 'Vérifier' }).click()

    await expect(page.getByTestId('scan-result')).toContainText('VALIDE')
  })
})

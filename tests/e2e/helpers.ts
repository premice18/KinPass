// Helpers partagés entre les tests end-to-end.
//
// NB : ce fichier ne contient pas de suffixe `.spec.ts` ni `.test.ts`, il n'est
// donc pas collecté par Playwright comme un fichier de tests.
import type { Page } from '@playwright/test'

// Libellés exacts des boutons de navigation de la coquille SPA (KinPassApp).
export type NavLabel = 'Accueil' | 'Tableau de bord' | 'Créer' | 'Billetterie' | 'Scanner'

// Navigue vers une vue via le menu principal (bouton au libellé exact).
// Le menu desktop est visible au viewport par défaut (≥ md).
export async function goTo(page: Page, label: NavLabel): Promise<void> {
  await page.getByRole('button', { name: label, exact: true }).first().click()
}

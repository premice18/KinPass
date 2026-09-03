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

// Identifiants de l'organisateur de démonstration (cf. scripts/seed-demo.mts).
export const DEMO_EMAIL = 'organisateur@kinpass.test'
export const DEMO_PASSWORD = 'Demo@2026'

// Connecte l'utilisateur de démonstration via l'interface de connexion
// (/auth/login), puis attend la redirection vers le dashboard.
export async function loginAsDemo(page: Page): Promise<void> {
  await page.goto('/auth/login')
  await page.getByLabel('Adresse email').fill(DEMO_EMAIL)
  await page.getByLabel('Mot de passe').fill(DEMO_PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  // Après connexion, redirection vers ?view=dashboard (coquille SPA).
  await page.waitForURL(/view=dashboard/, { timeout: 15000 })
}


// Configuration Playwright — tests end-to-end Kin Pass
//
// Points clés :
// - `webServer` démarre le serveur Next.js (`dev`) avant les tests puis l'arrête.
//   On passe par `corepack` pour que `pnpm` soit résolu quel que soit
//   l'environnement (Corepack est fourni avec Node.js 20+).
// - `globalSetup` réinitialise la base de démonstration (seed `--reset`) pour
//   garantir des données déterministes au début de chaque exécution.
// - `workers: 1` : les tests écrivent dans une vraie base PostgreSQL partagée,
//   on les exécute donc en série pour éviter toute interférence d'état. Cette
//   contrainte pourra être levée quand les tests seront isolés (reset par test).
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  // Dossier contenant les fichiers *.spec.ts
  testDir: './tests/e2e',

  // Timeout global par test (généreux : la première requête compile les routes).
  timeout: 60_000,
  expect: { timeout: 15_000 },

  // Exécution en série pour la cohérence de la base (voir note en tête de fichier).
  fullyParallel: false,
  workers: 1,

  // Nombre de tentatives : 0 en local, 2 en CI pour absorber les flakiness réseau.
  retries: process.env.CI ? 2 : 0,

  reporter: [['list']],

  // Setup global : réinitialise la base de démo avant la suite.
  globalSetup: './tests/global-setup.ts',

  use: {
    // Toutes les URLs de test sont relatives à cette base.
    baseURL: 'http://localhost:3000',
    // Capture d'écran uniquement en cas d'échec.
    screenshot: 'only-on-failure',
    // Trace conservée à la première tentative échouée (débogage).
    trace: 'on-first-retry',
  },

  // Navigateurs : Chromium en priorité. Firefox et WebKit sont disponibles
  // (déjà installés) — décommenter pour élargir la matrice.
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  // Serveur de développement lancé automatiquement par Playwright.
  webServer: {
    command: 'corepack pnpm dev',
    url: 'http://localhost:3000',
    // En local, réutilise un serveur déjà lancé ; en CI, démarre systématiquement.
    reuseExistingServer: !process.env.CI,
    // Le premier démarrage compile les routes : délai de disponibilité large.
    timeout: 120_000,
  },
})

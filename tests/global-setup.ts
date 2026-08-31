// Setup global Playwright — exécuté une fois avant la suite de tests.
//
// Réinitialise la base de démonstration (organisateur de test + événements,
// billets, scans) afin que les tests partent d'un état connu et déterministe.
// Le script seed charge lui-même `.env.local` (variable DATABASE_URL).
import { execSync } from 'node:child_process'

export default function globalSetup(): void {
  // Exécution depuis la racine du projet (là où se trouve playwright.config.ts).
  execSync('node scripts/seed-demo.mts --reset', {
    stdio: 'inherit',
    cwd: process.cwd(),
  })
}

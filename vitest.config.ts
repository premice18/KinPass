// Configuration Vitest — tests unitaires (hors E2E).
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: {
    // Les tests unitaires vivent dans tests/unit/*.test.ts (jamais de base,
    // pas de serveur — logique pure et validateurs uniquement).
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})

import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// Charge explicitement `.env.local` (utilisé par Next.js, non couvert par `dotenv/config`).
config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})

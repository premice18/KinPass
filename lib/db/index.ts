import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

// Connexion PostgreSQL (Neon) — URL poolée fournie via DATABASE_URL.
// Le client est instancié une seule fois (singleton) pour éviter les fuites
// de connexions en environnement serverless (Next.js).
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL est manquante. Ajoutez-la dans .env.local.')
}

// Mode SSL requis par Neon (le flag sslmode=require est déjà présent dans l'URL).
const client = postgres(connectionString, { max: 1 })

export const db = drizzle(client, { schema })
export { schema }

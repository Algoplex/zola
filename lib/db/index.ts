import { drizzle } from "drizzle-orm/node-postgres"
import pg from "pg"
import * as schema from "./schema"

const { Pool } = pg

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || ""

if (!connectionString) {
  console.error(
    "Missing database connection string. Set POSTGRES_URL or DATABASE_URL."
  )
}

const pool = new Pool({
  connectionString,
  max: 1, // Keep low for serverless to avoid connection exhaustion
  idleTimeoutMillis: 10000, // Close idle clients after 10s
  connectionTimeoutMillis: 10000, // Return error after 10s if connection can't be established
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 5000, // Start keepalive after 5s
})

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
})

export const db = drizzle(pool, { schema })

// Re-export schema for convenience
export * from "./schema"

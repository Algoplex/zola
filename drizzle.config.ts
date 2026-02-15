import { defineConfig } from "drizzle-kit"
import dotenv from "dotenv"
import path from "path"

dotenv.config({
  path: path.join(process.cwd(), ".vercel", ".env.development.local"),
})

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL || "",
    ssl: process.env.DATABASE_SSL === "true",
  },
  verbose: process.env.DEBUG === "true",
  strict: true,
})

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Schema source
  schema: "./lib/db/schema.ts",

  // Generated migration files — committed to the repo
  out: "./drizzle",

  // Neon Postgres
  dialect: "postgresql",

  dbCredentials: {
    // Read from .env.local / deployment environment
    url: process.env.DATABASE_URL ?? "postgresql://placeholder/placeholder",
  },

  // Print verbose SQL when running push / generate
  verbose: true,

  // Strict mode: fail on ambiguous schema changes rather than guess
  strict: true,
});

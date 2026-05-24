/**
 * Neon HTTP client + Drizzle.
 * Server-only. Do NOT import from any client component.
 */
import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  // Throw lazily so build-time `tsc --noEmit` does not fail.
  // Runtime callers will see clear error.
  // eslint-disable-next-line no-console
  console.warn("[db] DATABASE_URL not set — runtime calls will fail");
}

export const sql = neon(url ?? "postgres://placeholder");
export const db = drizzle(sql, { schema });
export type DB = typeof db;
export { schema };

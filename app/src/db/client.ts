/**
 * Neon HTTP client + Drizzle (lazy init).
 * Server-only. Do NOT import from any client component.
 *
 * v0.1.1 (Phase D round-001, W3 fix):
 * - Removed module-level `neon()` call which required DATABASE_URL at import
 *   time and forced `npm run build` to be invoked with a stub env var.
 * - `sql` and `db` are now lazy getters; the Neon client is constructed on
 *   the first runtime call. Build / typecheck no longer touch any network
 *   client and require no env at all.
 */
import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _sql: NeonQueryFunction<false, false> | null = null;
let _db: DrizzleDb | null = null;

function getClient(): { sql: NeonQueryFunction<false, false>; db: DrizzleDb } {
  if (_sql && _db) return { sql: _sql, db: _db };
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "[db] DATABASE_URL is not set. Configure it in Vercel env vars " +
        "(or .env.local for local dev) before issuing DB queries.",
    );
  }
  _sql = neon(url);
  _db = drizzle(_sql, { schema });
  return { sql: _sql, db: _db };
}

// Backwards-compatible named exports — kept as Proxies so existing
// `import { db, sql } from "@/db/client"` call sites do not change.
// Property access / function calls on the proxy trigger lazy init.
export const sql: NeonQueryFunction<false, false> = new Proxy(
  (() => {}) as unknown as NeonQueryFunction<false, false>,
  {
    apply(_t, _thisArg, args: unknown[]) {
      const fn = getClient().sql as unknown as (...a: unknown[]) => unknown;
      return fn(...args);
    },
    get(_t, prop) {
      const real = getClient().sql as unknown as Record<string | symbol, unknown>;
      return real[prop];
    },
  },
);

export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get(_t, prop) {
    const real = getClient().db as unknown as Record<string | symbol, unknown>;
    const v = real[prop];
    return typeof v === "function" ? (v as (...a: unknown[]) => unknown).bind(real) : v;
  },
});

export type DB = typeof db;
export { schema };

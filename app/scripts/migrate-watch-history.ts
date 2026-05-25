/**
 * round-013 一次性增量迁移:创建 watch_history 表(查看记录)。
 * 纯增量(IF NOT EXISTS),不触碰任何已有表/列。
 * 运行:DATABASE_URL=... npx tsx scripts/migrate-watch-history.ts
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}
const sql = neon(url);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS watch_history (
      id serial PRIMARY KEY,
      user_id text NOT NULL,
      video_id integer NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      watched_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS watch_history_user_video_uq
      ON watch_history (user_id, video_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS watch_history_user_idx
      ON watch_history (user_id, watched_at)
  `;
  const check = (await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'watch_history' ORDER BY ordinal_position
  `) as Array<{ column_name: string }>;
  console.log("watch_history columns:", check.map((r) => r.column_name).join(", "));
  console.log("OK · watch_history ready");
}

main().catch((e) => {
  console.error("migration failed:", e);
  process.exit(1);
});

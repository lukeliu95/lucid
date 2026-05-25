// 用户私有数据查询(收藏 / 查看记录)。被 /me 页与 favorites|history API 共用。
import "server-only";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import type { VideoCard } from "./types";

type JoinRow = {
  videos: typeof schema.videos.$inferSelect;
  people: typeof schema.people.$inferSelect;
  videos_ai: typeof schema.videos_ai.$inferSelect | null;
};

function mapRows(rows: JoinRow[]): VideoCard[] {
  return rows.map((r) => ({
    slug: r.videos.slug,
    title_zh: r.videos.title_zh,
    title_en: r.videos.title_en,
    cover_url: r.videos.cover_url ?? "",
    duration_sec: r.videos.duration_sec,
    person: {
      slug: r.people.slug,
      name_zh: r.people.name_zh,
      name_en: r.people.name_en,
    },
    topics: [],
    one_liner_zh: r.videos_ai?.summary_zh ?? undefined,
    one_liner_en: r.videos_ai?.summary_en ?? undefined,
  }));
}

export async function getUserFavorites(userId: string): Promise<VideoCard[]> {
  const rows = await db
    .select()
    .from(schema.favorites)
    .innerJoin(schema.videos, eq(schema.favorites.video_id, schema.videos.id))
    .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
    .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
    .where(eq(schema.favorites.user_id, userId))
    .orderBy(desc(schema.favorites.created_at));
  return mapRows(rows as unknown as JoinRow[]);
}

export async function getUserHistory(userId: string): Promise<VideoCard[]> {
  const rows = await db
    .select()
    .from(schema.watch_history)
    .innerJoin(schema.videos, eq(schema.watch_history.video_id, schema.videos.id))
    .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
    .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
    .where(eq(schema.watch_history.user_id, userId))
    .orderBy(desc(schema.watch_history.watched_at))
    .limit(50);
  return mapRows(rows as unknown as JoinRow[]);
}

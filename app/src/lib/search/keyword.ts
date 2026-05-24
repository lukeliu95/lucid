/**
 * S8 · keyword-search (Script)
 * Postgres ILIKE / pg_trgm for zh, ts_vector for en.
 */
import "server-only";
import { db, schema } from "@/db/client";
import { sql, eq, ilike, or } from "drizzle-orm";
import type { VideoCard, SearchResults } from "@/lib/types";

function isCJK(s: string): boolean {
  return /[㐀-鿿]/.test(s);
}

export async function keywordSearch(q: string): Promise<SearchResults> {
  const cjk = isCJK(q);
  const like = `%${q}%`;

  const videoRows = cjk
    ? await db.select().from(schema.videos)
        .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
        .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
        .where(or(
          ilike(schema.videos.title_zh, like),
          ilike(schema.videos_ai.summary_zh, like),
        ))
        .limit(20)
    : await db.select().from(schema.videos)
        .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
        .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
        .where(or(
          ilike(schema.videos.title_en, like),
          ilike(schema.videos_ai.summary_en, like),
        ))
        .limit(20);

  const videos: VideoCard[] = videoRows.map((r) => ({
    slug: r.videos.slug,
    title_zh: r.videos.title_zh,
    title_en: r.videos.title_en,
    cover_url: r.videos.cover_url ?? "",
    duration_sec: r.videos.duration_sec,
    person: { slug: r.people.slug, name_zh: r.people.name_zh, name_en: r.people.name_en },
    topics: [],  // omit; fill via separate query if needed
    one_liner_zh: r.videos_ai?.summary_zh ?? undefined,
    one_liner_en: r.videos_ai?.summary_en ?? undefined,
  }));

  const peopleRows = await db.select().from(schema.people).where(or(
    ilike(schema.people.name_zh, like),
    ilike(schema.people.name_en, like),
  )).limit(10);

  const topicRows = await db.select().from(schema.topics).where(or(
    ilike(schema.topics.name_zh, like),
    ilike(schema.topics.name_en, like),
  )).limit(10);

  return {
    query: q,
    mode: "keyword",
    videos,
    people: peopleRows.map((p) => ({
      slug: p.slug, name_zh: p.name_zh, name_en: p.name_en,
      avatar_url: p.avatar_url ?? "",
      bio_zh: p.bio_zh ?? "", bio_en: p.bio_en ?? "",
    })),
    topics: topicRows.map((t) => ({
      slug: t.slug, name_zh: t.name_zh, name_en: t.name_en,
      intro_zh: t.intro_zh ?? "", intro_en: t.intro_en ?? "",
    })),
  };
}

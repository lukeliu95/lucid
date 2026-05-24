/**
 * S7 · semantic-search (Hybrid · Script part)
 * query → embed → pgvector cosine top-k → VideoCard[]
 */
import "server-only";
import { db, schema } from "@/db/client";
import { sql, eq } from "drizzle-orm";
import { embedText } from "@/lib/embedding";
import type { VideoCard, SearchResults } from "@/lib/types";

export async function semanticSearch(q: string, topK = 5): Promise<SearchResults> {
  const vec = await embedText(q);
  const vecLiteral = `[${vec.join(",")}]`;

  // pgvector cosine distance operator: <=>  (smaller = closer)
  const rows = await db.execute(sql`
    SELECT v.id, v.slug, v.title_zh, v.title_en, v.cover_url, v.duration_sec,
           p.slug AS p_slug, p.name_zh AS p_name_zh, p.name_en AS p_name_en,
           a.summary_zh, a.summary_en,
           (e.embedding <=> ${vecLiteral}::vector) AS distance
    FROM video_embeddings e
    JOIN videos v ON v.id = e.video_id
    JOIN people p ON p.id = v.person_id
    LEFT JOIN videos_ai a ON a.video_id = v.id
    WHERE v.ai_status = 'ai_done'
    ORDER BY e.embedding <=> ${vecLiteral}::vector
    LIMIT ${topK}
  `);

  const videos: VideoCard[] = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    slug: String(r.slug),
    title_zh: String(r.title_zh),
    title_en: String(r.title_en),
    cover_url: (r.cover_url as string) ?? "",
    duration_sec: Number(r.duration_sec),
    person: {
      slug: String(r.p_slug),
      name_zh: String(r.p_name_zh),
      name_en: String(r.p_name_en),
    },
    topics: [],
    one_liner_zh: (r.summary_zh as string) ?? undefined,
    one_liner_en: (r.summary_en as string) ?? undefined,
  }));

  return {
    query: q,
    mode: "semantic",
    videos,
    people: [],
    topics: [],
  };
}

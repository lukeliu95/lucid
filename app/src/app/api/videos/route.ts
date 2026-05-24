/**
 * GET /api/videos — list latest videos as VideoCard[]
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import type { VideoCard } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select()
      .from(schema.videos)
      .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
      .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
      .orderBy(desc(schema.videos.published_at))
      .limit(60);

    const cards: VideoCard[] = rows.map((r) => ({
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

    return NextResponse.json(cards);
  } catch (e) {
    return NextResponse.json(
      { error: "internal", detail: (e as Error).message },
      { status: 500 },
    );
  }
}

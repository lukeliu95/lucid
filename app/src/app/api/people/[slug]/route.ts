/**
 * GET /api/people/[slug] — PersonDetail
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import type { PersonDetail, VideoCard } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const person = await db.select().from(schema.people).where(eq(schema.people.slug, slug)).limit(1);
    if (person.length === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const p = person[0];

    const videoRows = await db.select()
      .from(schema.videos)
      .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
      .where(eq(schema.videos.person_id, p.id))
      .orderBy(desc(schema.videos.published_at));

    const videos: VideoCard[] = videoRows.map((r) => ({
      slug: r.videos.slug,
      title_zh: r.videos.title_zh,
      title_en: r.videos.title_en,
      cover_url: r.videos.cover_url ?? "",
      duration_sec: r.videos.duration_sec,
      person: { slug: p.slug, name_zh: p.name_zh, name_en: p.name_en },
      topics: [],
      one_liner_zh: r.videos_ai?.summary_zh ?? undefined,
      one_liner_en: r.videos_ai?.summary_en ?? undefined,
    }));

    const detail: PersonDetail = {
      slug: p.slug,
      name_zh: p.name_zh,
      name_en: p.name_en,
      title_zh: p.title_zh ?? "",
      title_en: p.title_en ?? "",
      avatar_url: p.avatar_url ?? "",
      bio_zh: p.bio_zh ?? "",
      bio_en: p.bio_en ?? "",
      signature_views_zh: p.signature_views_zh,
      signature_views_en: p.signature_views_en,
      videos,
    };

    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: "internal", detail: (e as Error).message }, { status: 500 });
  }
}

/**
 * GET /api/topics/[slug] — TopicDetail
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import type { TopicDetail, VideoCard, PersonDetail } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  try {
    const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, slug)).limit(1))[0];
    if (!t) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const rows = await db.select()
      .from(schema.videos_topics)
      .innerJoin(schema.videos, eq(schema.videos_topics.video_id, schema.videos.id))
      .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
      .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
      .where(eq(schema.videos_topics.topic_id, t.id))
      .orderBy(desc(schema.videos.published_at));

    const videos: VideoCard[] = rows.map((r) => ({
      slug: r.videos.slug,
      title_zh: r.videos.title_zh,
      title_en: r.videos.title_en,
      cover_url: r.videos.cover_url ?? "",
      duration_sec: r.videos.duration_sec,
      person: { slug: r.people.slug, name_zh: r.people.name_zh, name_en: r.people.name_en },
      topics: [],
      one_liner_zh: r.videos_ai?.summary_zh ?? undefined,
      one_liner_en: r.videos_ai?.summary_en ?? undefined,
    }));

    // dedupe related people
    const peopleMap = new Map<string, Pick<PersonDetail, "slug" | "name_zh" | "name_en" | "avatar_url">>();
    for (const r of rows) {
      peopleMap.set(r.people.slug, {
        slug: r.people.slug,
        name_zh: r.people.name_zh,
        name_en: r.people.name_en,
        avatar_url: r.people.avatar_url ?? "",
      });
    }

    const detail: TopicDetail = {
      slug: t.slug,
      name_zh: t.name_zh,
      name_en: t.name_en,
      intro_zh: t.intro_zh ?? "",
      intro_en: t.intro_en ?? "",
      videos,
      related_people: [...peopleMap.values()],
    };
    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json({ error: "internal", detail: (e as Error).message }, { status: 500 });
  }
}

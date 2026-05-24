/**
 * GET /api/videos/[slug] — VideoDetail
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import type { VideoDetail } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  try {
    const rows = await db.select()
      .from(schema.videos)
      .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
      .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
      .where(eq(schema.videos.slug, slug))
      .limit(1);

    const row = rows[0];
    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // topics
    const topicRows = await db.select({ slug: schema.topics.slug, name_zh: schema.topics.name_zh, name_en: schema.topics.name_en })
      .from(schema.videos_topics)
      .innerJoin(schema.topics, eq(schema.videos_topics.topic_id, schema.topics.id))
      .where(eq(schema.videos_topics.video_id, row.videos.id));

    const ai = row.videos_ai;

    const detail: VideoDetail = {
      slug: row.videos.slug,
      title_zh: row.videos.title_zh,
      title_en: row.videos.title_en,
      cover_url: row.videos.cover_url ?? "",
      duration_sec: row.videos.duration_sec,
      person: {
        slug: row.people.slug,
        name_zh: row.people.name_zh,
        name_en: row.people.name_en,
      },
      topics: topicRows,
      one_liner_zh: ai?.summary_zh ?? undefined,
      one_liner_en: ai?.summary_en ?? undefined,
      platform: row.videos.platform as "youtube" | "bilibili",
      platform_id: row.videos.platform_id,
      published_at: (row.videos.published_at ?? new Date()).toISOString(),
      ai_status: row.videos.ai_status as VideoDetail["ai_status"],
      ai: ai && row.videos.ai_status === "ai_done"
        ? {
            summary_zh: ai.summary_zh ?? "",
            summary_en: ai.summary_en ?? "",
            keypoints_zh: ai.keypoints_zh,
            keypoints_en: ai.keypoints_en,
            timeline_zh: ai.timeline_zh,
            timeline_en: ai.timeline_en,
            explainer_quick_zh: ai.explainer_quick_zh ?? "",
            explainer_quick_en: ai.explainer_quick_en ?? "",
            explainer_deep_zh: ai.explainer_deep_zh ?? "",
            explainer_deep_en: ai.explainer_deep_en ?? "",
          }
        : null,
    };

    return NextResponse.json(detail);
  } catch (e) {
    return NextResponse.json(
      { error: "internal", detail: (e as Error).message },
      { status: 500 },
    );
  }
}

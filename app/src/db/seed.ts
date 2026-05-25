/**
 * Seed the DB from the curated source of truth (src/lib/mock-data.ts).
 *
 * Replaces the old stub seed so the database mirrors exactly what the app
 * shows today: 5 topics, 10 people (+ avatars + signature views), 30 videos
 * (17 real YouTube IDs + drafts) with AI summaries / keypoints / timeline /
 * explainer.
 *
 * Idempotent: deletes content rows then re-inserts (FK cascades handle
 * videos_ai / videos_topics / embeddings / favorites on video delete).
 *
 * Run: DATABASE_URL=postgres://... npx tsx src/db/seed.ts
 */
import "dotenv/config";
import { db, schema } from "./client";
import { topicDetails, people as mockPeople, videoDetails } from "../lib/mock-data";

function mediaUrl(platform: string, id: string): string {
  return platform === "bilibili"
    ? `https://www.bilibili.com/video/${id}`
    : `https://www.youtube.com/watch?v=${id}`;
}

async function main() {
  console.log("[seed] start · source = mock-data.ts");

  // 1. wipe content (cascades to videos_ai / videos_topics / embeddings / favorites)
  await db.delete(schema.videos);
  await db.delete(schema.people);
  await db.delete(schema.topics);
  console.log("[seed] cleared topics / people / videos (+ cascades)");

  // 2. topics
  const topicRows = await db
    .insert(schema.topics)
    .values(
      topicDetails.map((t, i) => ({
        slug: t.slug,
        name_zh: t.name_zh,
        name_en: t.name_en,
        intro_zh: t.intro_zh,
        intro_en: t.intro_en,
        sort_order: i + 1,
      })),
    )
    .returning({ id: schema.topics.id, slug: schema.topics.slug });
  const topicId = new Map(topicRows.map((r) => [r.slug, r.id]));
  console.log(`[seed] topics: ${topicRows.length}`);

  // 3. people
  const peopleRows = await db
    .insert(schema.people)
    .values(
      mockPeople.map((p) => ({
        slug: p.slug,
        name_zh: p.name_zh,
        name_en: p.name_en,
        title_zh: p.title_zh,
        title_en: p.title_en,
        avatar_url: p.avatar_url,
        bio_zh: p.bio_zh,
        bio_en: p.bio_en,
        signature_views_zh: p.signature_views_zh,
        signature_views_en: p.signature_views_en,
      })),
    )
    .returning({ id: schema.people.id, slug: schema.people.slug });
  const personId = new Map(peopleRows.map((r) => [r.slug, r.id]));
  console.log(`[seed] people: ${peopleRows.length}`);

  // 4. videos
  const videoRows = await db
    .insert(schema.videos)
    .values(
      videoDetails.map((v) => ({
        slug: v.slug,
        platform: v.platform,
        platform_id: v.platform_id,
        url: mediaUrl(v.platform, v.platform_id),
        cover_url: v.cover_url || null,
        title_zh: v.title_zh,
        title_en: v.title_en,
        person_id: personId.get(v.person.slug)!,
        duration_sec: v.duration_sec,
        published_at: v.published_at ? new Date(v.published_at) : null,
        ai_status: v.ai_status,
      })),
    )
    .returning({ id: schema.videos.id, slug: schema.videos.slug });
  const videoId = new Map(videoRows.map((r) => [r.slug, r.id]));
  console.log(`[seed] videos: ${videoRows.length}`);

  // 5. videos_topics
  const vtValues = videoDetails.flatMap((v) =>
    v.topics
      .map((t) => ({ video_id: videoId.get(v.slug)!, topic_id: topicId.get(t.slug)! }))
      .filter((row) => row.video_id && row.topic_id),
  );
  if (vtValues.length) await db.insert(schema.videos_topics).values(vtValues);
  console.log(`[seed] videos_topics: ${vtValues.length}`);

  // 6. videos_ai (only videos that have AI content)
  const aiValues = videoDetails
    .filter((v) => v.ai)
    .map((v) => ({
      video_id: videoId.get(v.slug)!,
      summary_zh: v.ai!.summary_zh,
      summary_en: v.ai!.summary_en,
      keypoints_zh: v.ai!.keypoints_zh,
      keypoints_en: v.ai!.keypoints_en,
      timeline_zh: v.ai!.timeline_zh,
      timeline_en: v.ai!.timeline_en,
      explainer_quick_zh: v.ai!.explainer_quick_zh,
      explainer_quick_en: v.ai!.explainer_quick_en,
      explainer_deep_zh: v.ai!.explainer_deep_zh,
      explainer_deep_en: v.ai!.explainer_deep_en,
      model: "seeded:mock-data",
    }));
  if (aiValues.length) await db.insert(schema.videos_ai).values(aiValues);
  console.log(`[seed] videos_ai: ${aiValues.length}`);

  console.log("[seed] done ✓");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exit(1);
  });

/**
 * S6 · video-crud — admin
 * POST: create video. Two payload shapes:
 *   (a) url-only:        { url, person_slug?, topic_slugs? }
 *       → YouTube Data API v3 fetches metadata, title_en is real title,
 *         title_zh暂留英文(等 ingest pipeline 跑 S1-S5 双语生成)+ pending_translation: true。
 *   (b) full payload:    { url, platform, person_slug, topic_slugs, title_zh?, title_en? }
 *       → 旧行为保留向后兼容。
 * GET: list latest with status.
 *
 * Auth: env ADMIN_USER_IDS = comma-separated Clerk userIds (or "*" for dev).
 * Stub: read x-user-id header; replace with Clerk auth() later.
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";
import { extractVideoId, fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const list = (process.env.ADMIN_USER_IDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes("*") || list.includes(userId);
}

export async function GET(req: Request) {
  if (!isAdmin(req.headers.get("x-user-id"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const rows = await db.select({
    id: schema.videos.id,
    slug: schema.videos.slug,
    title_zh: schema.videos.title_zh,
    title_en: schema.videos.title_en,
    ai_status: schema.videos.ai_status,
    created_at: schema.videos.created_at,
  }).from(schema.videos).orderBy(desc(schema.videos.created_at)).limit(50);
  return NextResponse.json(rows);
}

type FullBody = {
  url: string;
  platform: "youtube" | "bilibili";
  person_slug: string;
  topic_slugs: string[];
  title_zh?: string;
  title_en?: string;
};

type UrlOnlyBody = {
  url: string;
  person_slug?: string;
  topic_slugs?: string[];
};

type Body = FullBody | UrlOnlyBody;

function isFullBody(b: Body): b is FullBody {
  return typeof (b as FullBody).platform === "string" && typeof (b as FullBody).person_slug === "string";
}

function extractBilibiliId(url: string): string {
  const m = url.match(/(BV[\w]+)/);
  return m?.[1] ?? "";
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

async function handleUrlOnly(body: UrlOnlyBody) {
  const videoId = extractVideoId(body.url);
  if (!videoId) {
    return NextResponse.json({ error: "invalid_youtube_url" }, { status: 400 });
  }
  const meta = await fetchVideoMetadata(videoId);
  if (!meta) {
    return NextResponse.json({ error: "video_not_found_or_private" }, { status: 404 });
  }

  let personId: number | null = null;
  let personSlugForSlug = "yt";
  if (body.person_slug) {
    const person = (
      await db.select().from(schema.people).where(eq(schema.people.slug, body.person_slug)).limit(1)
    )[0];
    if (!person) return NextResponse.json({ error: "person_not_found" }, { status: 404 });
    personId = person.id;
    personSlugForSlug = person.slug;
  } else {
    return NextResponse.json({ error: "person_slug_required" }, { status: 400 });
  }

  const slug = slugify(`${personSlugForSlug}-${slugify(meta.title)}`) || slugify(`${personSlugForSlug}-${videoId}`);

  try {
    const inserted = await db
      .insert(schema.videos)
      .values({
        slug,
        platform: "youtube",
        platform_id: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        cover_url: thumbnailUrl(videoId, "maxres"),
        title_zh: meta.title, // pending_translation: true (see response payload)
        title_en: meta.title,
        person_id: personId,
        duration_sec: meta.durationSec,
        published_at: meta.publishedAt ? new Date(meta.publishedAt) : null,
        ai_status: "pending",
      })
      .returning();

    const row = inserted[0];

    for (const ts of body.topic_slugs ?? []) {
      const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
      if (t) {
        await db
          .insert(schema.videos_topics)
          .values({ video_id: row.id, topic_id: t.id })
          .onConflictDoNothing();
      }
    }

    return NextResponse.json(
      {
        ...row,
        pending_translation: true,
        thumbnails: {
          maxres: thumbnailUrl(videoId, "maxres"),
          high: thumbnailUrl(videoId, "high"),
        },
      },
      { status: 201 },
    );
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal", detail: msg }, { status: 500 });
  }
}

async function handleFull(body: FullBody) {
  let platform_id = "";
  if (body.platform === "youtube") {
    platform_id = extractVideoId(body.url) ?? "";
  } else if (body.platform === "bilibili") {
    platform_id = extractBilibiliId(body.url);
  }
  if (!platform_id) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const person = (
    await db.select().from(schema.people).where(eq(schema.people.slug, body.person_slug)).limit(1)
  )[0];
  if (!person) return NextResponse.json({ error: "person_not_found" }, { status: 404 });

  const title_zh = body.title_zh ?? `${person.name_zh} - ${platform_id}`;
  const title_en = body.title_en ?? `${person.name_en} - ${platform_id}`;
  const slug = slugify(`${person.slug}-${platform_id}`);

  try {
    const inserted = await db
      .insert(schema.videos)
      .values({
        slug,
        platform: body.platform,
        platform_id,
        url: body.url,
        cover_url: body.platform === "youtube" ? thumbnailUrl(platform_id, "maxres") : null,
        title_zh,
        title_en,
        person_id: person.id,
        ai_status: "pending",
      })
      .returning({ id: schema.videos.id });

    const videoId = inserted[0].id;

    for (const ts of body.topic_slugs ?? []) {
      const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
      if (t) {
        await db
          .insert(schema.videos_topics)
          .values({ video_id: videoId, topic_id: t.id })
          .onConflictDoNothing();
      }
    }

    return NextResponse.json({ id: videoId, slug, ai_status: "pending" }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal", detail: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req.headers.get("x-user-id"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.url) {
    return NextResponse.json({ error: "missing_url" }, { status: 400 });
  }
  if (isFullBody(body)) {
    return handleFull(body);
  }
  return handleUrlOnly(body);
}

/**
 * S6 · video-crud — admin
 * POST: create video (ai_status=pending) + return id (operator then runs ingest CLI)
 * GET:  list latest with status
 *
 * Auth: env ADMIN_USER_IDS = comma-separated Clerk userIds (or "*" for dev).
 * Stub: read x-user-id header; replace with Clerk auth() later.
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { eq, desc } from "drizzle-orm";

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

type Body = {
  url: string;
  platform: "youtube" | "bilibili";
  person_slug: string;
  topic_slugs: string[];
  title_zh?: string;
  title_en?: string;
};

function extractPlatformId(platform: string, url: string): string {
  if (platform === "youtube") {
    const m = url.match(/[?&]v=([\w-]+)/) ?? url.match(/youtu\.be\/([\w-]+)/);
    return m?.[1] ?? "";
  }
  if (platform === "bilibili") {
    const m = url.match(/(BV[\w]+)/);
    return m?.[1] ?? "";
  }
  return "";
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

export async function POST(req: Request) {
  if (!isAdmin(req.headers.get("x-user-id"))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Body | null;
  if (!body?.url || !body?.platform || !body?.person_slug) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const platform_id = extractPlatformId(body.platform, body.url);
  if (!platform_id) return NextResponse.json({ error: "invalid_url" }, { status: 400 });

  const person = (await db.select().from(schema.people).where(eq(schema.people.slug, body.person_slug)).limit(1))[0];
  if (!person) return NextResponse.json({ error: "person_not_found" }, { status: 404 });

  const title_zh = body.title_zh ?? `${person.name_zh} - ${platform_id}`;
  const title_en = body.title_en ?? `${person.name_en} - ${platform_id}`;
  const slug = slugify(`${person.slug}-${platform_id}`);

  try {
    const inserted = await db.insert(schema.videos).values({
      slug,
      platform: body.platform,
      platform_id,
      url: body.url,
      title_zh,
      title_en,
      person_id: person.id,
      ai_status: "pending",
    }).returning({ id: schema.videos.id });

    const videoId = inserted[0].id;

    // topic links
    for (const ts of body.topic_slugs ?? []) {
      const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
      if (t) {
        await db.insert(schema.videos_topics).values({ video_id: videoId, topic_id: t.id }).onConflictDoNothing();
      }
    }

    // NOTE: enqueueIngest stub. MVP: operator runs `npx tsx src/scripts/ingest-video.ts --video-id <id>`.
    // Phase D: replace with Inngest / Vercel Cron job.
    return NextResponse.json({ id: videoId, slug, ai_status: "pending" }, { status: 201 });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "already_exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "internal", detail: msg }, { status: 500 });
  }
}

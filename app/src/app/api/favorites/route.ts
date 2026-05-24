/**
 * S10 · favorite-crud
 * GET / POST / DELETE — requires Clerk session.
 *
 * Note: Clerk is not yet installed (小赵 D6 task). We read userId from
 * a header `x-user-id` as a stub; once Clerk is wired this code will
 * be replaced with `auth()` from `@clerk/nextjs/server`.
 */
import { NextResponse } from "next/server";
import { db, schema } from "@/db/client";
import { and, eq, desc } from "drizzle-orm";
import type { VideoCard } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(req: Request): Promise<string | null> {
  // TODO replace with: const { userId } = await auth(); from @clerk/nextjs/server
  const xUser = req.headers.get("x-user-id");
  return xUser?.trim() || null;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db.select()
    .from(schema.favorites)
    .innerJoin(schema.videos, eq(schema.favorites.video_id, schema.videos.id))
    .innerJoin(schema.people, eq(schema.videos.person_id, schema.people.id))
    .leftJoin(schema.videos_ai, eq(schema.videos.id, schema.videos_ai.video_id))
    .where(eq(schema.favorites.user_id, userId))
    .orderBy(desc(schema.favorites.created_at));

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
  return NextResponse.json(videos);
}

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { video_id?: number };
  if (!body.video_id) return NextResponse.json({ error: "video_id_required" }, { status: 400 });
  try {
    await db.insert(schema.favorites)
      .values({ user_id: userId, video_id: body.video_id })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "internal", detail: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { video_id?: number };
  if (!body.video_id) return NextResponse.json({ error: "video_id_required" }, { status: 400 });
  await db.delete(schema.favorites).where(
    and(eq(schema.favorites.user_id, userId), eq(schema.favorites.video_id, body.video_id)),
  );
  return NextResponse.json({ ok: true });
}

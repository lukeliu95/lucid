/**
 * watch-history (round-013)
 * - GET           列出当前用户最近查看(VideoCard[],按 watched_at 倒序)
 * - POST { slug } 记录一次查看(每个 user+video 一行,重复查看更新时间)
 * 鉴权:Clerk session。
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/db/client";
import { eq, sql } from "drizzle-orm";
import { getUserHistory } from "@/lib/user-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json(await getUserHistory(userId));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });

  const v = (
    await db
      .select({ id: schema.videos.id })
      .from(schema.videos)
      .where(eq(schema.videos.slug, body.slug))
      .limit(1)
  )[0];
  if (!v) return NextResponse.json({ error: "video_not_found" }, { status: 404 });

  await db
    .insert(schema.watch_history)
    .values({ user_id: userId, video_id: v.id })
    .onConflictDoUpdate({
      target: [schema.watch_history.user_id, schema.watch_history.video_id],
      set: { watched_at: sql`now()` },
    });
  return NextResponse.json({ ok: true });
}

/**
 * S10 · favorite-crud (round-013)
 * 按 slug 操作,服务端解析 slug → video.id(不向前端暴露数字 id)。
 * - GET            列出当前用户收藏(VideoCard[])
 * - GET ?slug=...  查询单条是否已收藏 { favorited: boolean }
 * - POST { slug }  收藏
 * - DELETE { slug } 取消收藏
 * 鉴权:Clerk session。
 */
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, schema } from "@/db/client";
import { and, eq } from "drizzle-orm";
import { getUserFavorites } from "@/lib/user-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const { userId } = await auth();
  return userId;
}

async function videoIdBySlug(slug: string): Promise<number | null> {
  const v = (
    await db
      .select({ id: schema.videos.id })
      .from(schema.videos)
      .where(eq(schema.videos.slug, slug))
      .limit(1)
  )[0];
  return v?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 单条状态查询(供收藏按钮初始化)。
  const slug = new URL(req.url).searchParams.get("slug");
  if (slug) {
    const vid = await videoIdBySlug(slug);
    if (!vid) return NextResponse.json({ favorited: false });
    const row = (
      await db
        .select({ id: schema.favorites.id })
        .from(schema.favorites)
        .where(and(eq(schema.favorites.user_id, userId), eq(schema.favorites.video_id, vid)))
        .limit(1)
    )[0];
    return NextResponse.json({ favorited: !!row });
  }

  return NextResponse.json(await getUserFavorites(userId));
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });
  const vid = await videoIdBySlug(body.slug);
  if (!vid) return NextResponse.json({ error: "video_not_found" }, { status: 404 });
  try {
    await db
      .insert(schema.favorites)
      .values({ user_id: userId, video_id: vid })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true, favorited: true });
  } catch (e) {
    return NextResponse.json({ error: "internal", detail: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug) return NextResponse.json({ error: "slug_required" }, { status: 400 });
  const vid = await videoIdBySlug(body.slug);
  if (!vid) return NextResponse.json({ ok: true, favorited: false });
  await db
    .delete(schema.favorites)
    .where(and(eq(schema.favorites.user_id, userId), eq(schema.favorites.video_id, vid)));
  return NextResponse.json({ ok: true, favorited: false });
}

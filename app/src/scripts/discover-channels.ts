/**
 * discover-channels.ts — v2 频道订阅自动发现。
 *
 * 对 people 表里每个人物:解析其 YouTube 频道(首次 search 解析,缓存到 channels.json)→
 *   查频道最新上传 → 过滤(长视频 ≥20min · 未入库)→ insert 成 ai_status=pending。
 * 之后 process-pending 自动出中文速读。
 *
 *   DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/discover-channels.ts [--dry-run]
 *
 * 配额:首次每人 search(channel)100u;之后每人 search(channelId,date)100u + 批量 videos.list 取时长。
 */
import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { searchVideos, fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";

const DRY = process.argv.includes("--dry-run");
const CACHE = path.resolve(process.cwd(), "src/scripts/channels.json");
const MIN_SEC = Number(process.env.DISCOVER_MIN_SEC ?? "1200"); // ≥20min 才算长内容
const PER_CHANNEL = Number(process.env.DISCOVER_PER_CHANNEL ?? "5"); // 每频道查最近几条

// 人物 → 主题(自动发现的视频缺人工标注,按人物给个主 topic)
const PERSON_TOPIC: Record<string, string> = {
  "dario-amodei": "ai", "andrej-karpathy": "ai", "demis-hassabis": "ai",
  "sam-altman": "ai", "ilya-sutskever": "ai", "yann-lecun": "ai",
  "jensen-huang": "chip", "naval-ravikant": "startup", "paul-graham": "startup",
  "patrick-collison": "startup", "marc-andreessen": "startup", "lex-fridman": "future-of-work",
};

function loadCache(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch { return {}; }
}
function saveCache(c: Record<string, string>) { fs.writeFileSync(CACHE, JSON.stringify(c, null, 2)); }

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

async function main() {
  const cache = loadCache();
  const people = await db.select().from(schema.people);
  let discovered = 0;

  for (const p of people) {
    // 1. 解析频道 id(缓存)
    let channelId = cache[p.slug];
    if (!channelId) {
      const r = await searchVideos(p.name_en, { maxResults: 1, type: "channel" });
      channelId = r[0]?.videoId ?? ""; // 频道搜索时 videoId 字段装的是 channelId
      if (channelId) { cache[p.slug] = channelId; saveCache(cache); }
    }
    if (!channelId) { console.warn(`[${p.slug}] 频道未解析,跳过`); continue; }

    // 2. 查频道最新上传
    const recent = await searchVideos("", { channelId, type: "video", order: "date", maxResults: PER_CHANNEL });
    for (const item of recent) {
      const vid = item.videoId;
      if (!vid) continue;
      // 已入库?
      const exists = (await db.select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.platform_id, vid)).limit(1))[0];
      if (exists) continue;
      // 时长过滤
      const meta = await fetchVideoMetadata(vid);
      if (!meta || (meta.durationSec ?? 0) < MIN_SEC) continue;

      const slug = slugify(`${p.slug}-${meta.title}`) || slugify(`${p.slug}-${vid}`);
      console.log(`[发现] ${p.slug} · ${vid} · ${(meta.durationSec / 60).toFixed(0)}min · ${meta.title.slice(0, 50)}`);
      if (DRY) { discovered++; continue; }

      try {
        const ins = await db.insert(schema.videos).values({
          slug, platform: "youtube", platform_id: vid,
          url: `https://www.youtube.com/watch?v=${vid}`,
          cover_url: thumbnailUrl(vid, "maxres"),
          title_zh: meta.title, title_en: meta.title, // 中文标题待 ingest/人工后续优化
          person_id: p.id, duration_sec: meta.durationSec ?? 0,
          published_at: meta.publishedAt ? new Date(meta.publishedAt) : null,
          ai_status: "pending",
        }).onConflictDoNothing().returning({ id: schema.videos.id });
        if (ins.length === 0) continue;
        const topic = PERSON_TOPIC[p.slug];
        if (topic) {
          const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, topic)).limit(1))[0];
          if (t) await db.insert(schema.videos_topics).values({ video_id: ins[0].id, topic_id: t.id }).onConflictDoNothing();
        }
        discovered++;
      } catch (e) { console.error(`  insert 失败 ${vid}: ${(e as Error).message}`); }
    }
  }
  console.log(`[discover] ${DRY ? "DRY · " : ""}入队新视频 = ${discovered}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

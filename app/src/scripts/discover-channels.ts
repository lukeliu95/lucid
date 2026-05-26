/**
 * discover-channels.ts — v2 内容发现(按人名搜视频版)。
 *
 * 设计修正:明读收录的人多是访谈嘉宾(Dario/Sam/Demis…),没有自己的 YouTube 频道,
 *   "订阅本人频道"会搜到无关频道。改为【按人名搜最近视频】(order=date),
 *   过滤长视频(≥20min)+ 未入库 → insert 成 pending,由 process-pending 出速读。
 *
 *   DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/discover-channels.ts [--dry-run]
 *
 * 防 429:search.list 100u/次 + 每分钟有上限,人物间 sleep 节流。
 */
import "dotenv/config";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { searchVideos, fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";

const DRY = process.argv.includes("--dry-run");
const MIN_SEC = Number(process.env.DISCOVER_MIN_SEC ?? "1200"); // ≥20min
const PER_PERSON = Number(process.env.DISCOVER_PER_PERSON ?? "4");
const SLEEP_MS = Number(process.env.DISCOVER_SLEEP_MS ?? "1500"); // 人物间节流防 search-per-minute 429

const PERSON_TOPIC: Record<string, string> = {
  "dario-amodei": "ai", "andrej-karpathy": "ai", "demis-hassabis": "ai",
  "sam-altman": "ai", "ilya-sutskever": "ai", "yann-lecun": "ai",
  "jensen-huang": "chip", "naval-ravikant": "startup", "paul-graham": "startup",
  "patrick-collison": "startup", "marc-andreessen": "startup", "lex-fridman": "future-of-work",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

async function main() {
  const people = await db.select().from(schema.people);
  let discovered = 0;

  for (const p of people) {
    // 按人名搜最近视频(嘉宾型人物也能找到其新访谈,不依赖本人频道)
    let recent: Awaited<ReturnType<typeof searchVideos>> = [];
    try {
      recent = await searchVideos(p.name_en, { type: "video", order: "date", maxResults: PER_PERSON });
    } catch (e) {
      console.warn(`[${p.slug}] 搜索失败(可能 429,跳过本轮): ${(e as Error).message}`);
      await sleep(SLEEP_MS);
      continue;
    }

    for (const item of recent) {
      const vid = item.videoId;
      if (!vid) continue;
      const exists = (await db.select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.platform_id, vid)).limit(1))[0];
      if (exists) continue;
      const meta = await fetchVideoMetadata(vid);
      if (!meta || (meta.durationSec ?? 0) < MIN_SEC) continue;
      // 质量过滤:标题里应出现人物姓(降低无关视频)
      const lastName = p.name_en.split(" ").slice(-1)[0].toLowerCase();
      if (lastName && !meta.title.toLowerCase().includes(lastName)) continue;

      const slug = slugify(`${p.slug}-${meta.title}`) || slugify(`${p.slug}-${vid}`);
      console.log(`[发现] ${p.slug} · ${vid} · ${(meta.durationSec / 60).toFixed(0)}min · ${meta.title.slice(0, 50)}`);
      if (DRY) { discovered++; continue; }
      try {
        const ins = await db.insert(schema.videos).values({
          slug, platform: "youtube", platform_id: vid,
          url: `https://www.youtube.com/watch?v=${vid}`,
          cover_url: thumbnailUrl(vid, "maxres"),
          title_zh: meta.title, title_en: meta.title,
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
    await sleep(SLEEP_MS); // 节流
  }
  console.log(`[discover] ${DRY ? "DRY · " : ""}入队新视频 = ${discovered}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

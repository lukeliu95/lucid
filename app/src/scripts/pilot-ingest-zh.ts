/**
 * 单条试灌(中文内容 · 优先 YouTube 中文 CC)。验证张小珺频道接入可行性。
 * 运行:DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/pilot-ingest-zh.ts
 *
 * 流程:建人物 → 建视频行(pending)→ yt-dlp 抓 zh-Hans 自动字幕 → ffmpeg 转 srt →
 *   readSrtFile → runPipeline(S1-S4,生成中英双语速读)→ ai_done。
 * 中文 CC 缺失时报"需 Whisper 兜底"并停(本条已确认有 zh-Hans)。
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { db, schema } from "@/db/client";
import { eq } from "drizzle-orm";
import { fetchVideoMetadata, thumbnailUrl } from "@/lib/youtube/data-api";
import { readSrtFile } from "@/lib/i18n-asr";
import { runPipeline } from "@/lib/ai/pipeline";

// ---- 试灌目标(姚顺宇 · P0#1 · 已确认有 zh-Hans CC) ----
const VID = process.env.PILOT_VID || "ttkd0t5qTD4";
const TITLE_ZH = process.env.PILOT_TITLE_ZH ||
  "姚顺宇:在 Anthropic 和 Gemini 训模型、技术预测、英雄主义已过去";
const PERSON = {
  slug: "yao-shunyu",
  name_zh: "姚顺宇",
  name_en: "Yao Shunyu",
  title_zh: "AI 研究员 · Anthropic / Google DeepMind",
  title_en: "AI Researcher · Anthropic / Google DeepMind",
};
const TOPICS = ["ai"];
const SUB_DIR = "/tmp/lucid-subs-zh";

function sh(cmd: string, args: string[]): boolean {
  const r = spawnSync(cmd, args, { encoding: "utf8" });
  return r.status === 0;
}

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

/** 抓 zh 字幕 → srt 路径(或 null)。 */
function fetchZhSub(pid: string): string | null {
  fs.mkdirSync(SUB_DIR, { recursive: true });
  const baseArgs = [
    "--sleep-requests", "3", "--retries", "10", "--extractor-retries", "5",
    "--extractor-args", "youtube:player_client=tv,web_safari,web",
    "--skip-download", "--write-auto-sub", "--write-sub",
    "--sub-lang", "zh-Hans,zh-Hant,zh-CN,zh",
    "-o", `${SUB_DIR}/%(id)s.%(ext)s`,
    `https://www.youtube.com/watch?v=${pid}`,
  ];
  if (!sh("yt-dlp", ["--impersonate", "chrome", ...baseArgs])) sh("yt-dlp", baseArgs);
  const cands = [
    `${pid}.zh-Hans.vtt`, `${pid}.zh-CN.vtt`, `${pid}.zh.vtt`, `${pid}.zh-Hant.vtt`,
    `${pid}.zh-Hans.srt`, `${pid}.zh.srt`,
  ];
  const found = cands.map((c) => path.join(SUB_DIR, c)).find((p) => fs.existsSync(p) && fs.statSync(p).size > 0);
  if (!found) return null;
  if (found.endsWith(".srt")) return found;
  const srt = path.join(SUB_DIR, `${pid}.fixed.srt`);
  if (!sh("ffmpeg", ["-y", "-i", found, srt]) || !fs.existsSync(srt)) return null;
  return srt;
}

async function main() {
  // 1) person
  await db.insert(schema.people).values(PERSON).onConflictDoNothing();
  const person = (await db.select().from(schema.people).where(eq(schema.people.slug, PERSON.slug)).limit(1))[0];
  console.log("person:", person.slug, "id=", person.id);

  // 2) video row
  const meta = await fetchVideoMetadata(VID);
  if (!meta) throw new Error("no metadata");
  const slug = slugify(`${person.slug}-${meta.title}`) || `${person.slug}-${VID}`;
  const ins = await db.insert(schema.videos).values({
    slug, platform: "youtube", platform_id: VID,
    url: `https://www.youtube.com/watch?v=${VID}`,
    cover_url: thumbnailUrl(VID, "maxres"),
    title_zh: TITLE_ZH, title_en: meta.title,
    person_id: person.id, duration_sec: meta.durationSec ?? 0,
    published_at: meta.publishedAt ? new Date(meta.publishedAt) : null,
    ai_status: "pending",
  }).onConflictDoNothing().returning({ id: schema.videos.id });
  let videoId: number;
  if (ins.length === 0) {
    const existing = (await db.select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.platform_id, VID)).limit(1))[0];
    videoId = existing.id;
    console.log("video exists, reuse id=", videoId);
  } else {
    videoId = ins[0].id;
    for (const ts of TOPICS) {
      const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
      if (t) await db.insert(schema.videos_topics).values({ video_id: videoId, topic_id: t.id }).onConflictDoNothing();
    }
    console.log(`video created id=${videoId} slug=${slug} dur=${meta.durationSec}s`);
  }

  // 3) subtitle
  console.log("抓 zh 字幕...");
  const srt = fetchZhSub(VID);
  if (!srt) { console.error("✗ 无中文 CC — 需 Whisper 兜底"); process.exit(2); }
  const segments = await readSrtFile(srt);
  console.log(`字幕 ${segments.length} 段 · 文件 ${srt}`);
  if (segments.length === 0) { console.error("✗ 字幕解析为空"); process.exit(2); }

  // 4) pipeline
  console.log("跑 DeepSeek S1-S4...");
  await runPipeline({ video_id: videoId, video_title: TITLE_ZH, srt: segments });
  console.log(`✓ ai_done · /zh/videos/${slug}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });

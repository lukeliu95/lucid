/**
 * 批量灌中文内容(优先 YouTube 中文 CC)。张小珺频道 P0/P1 有 CC 的一批。
 * 运行:DOTENV_CONFIG_PATH=.env.local tsx --conditions=react-server src/scripts/batch-ingest-zh.ts
 * 无 CC 的视频会报"需 Whisper"并跳过(单独走 whisper-cli 流程)。
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

type P = { slug: string; name_zh: string; name_en: string; title_zh: string; title_en: string };
const PEOPLE: P[] = [
  { slug: "luo-fuli", name_zh: "罗福莉", name_en: "Luo Fuli", title_zh: "小米大模型负责人 · 前 DeepSeek 研究员", title_en: "Xiaomi LLM Lead · ex-DeepSeek" },
  { slug: "saining-xie", name_zh: "谢赛宁", name_en: "Saining Xie", title_zh: "纽约大学计算机科学副教授 · 世界模型", title_en: "Associate Professor, NYU · World Models" },
  { slug: "gao-jiyang", name_zh: "高继扬", name_en: "Gao Jiyang", title_zh: "星海图创始人 · 具身智能", title_en: "Founder, GALAXEA · Embodied AI" },
];
type V = { vid: string; person: string; title_zh: string; topics: string[] };
const VIDEOS: V[] = [
  { vid: "V9eI-t3TApE", person: "luo-fuli", title_zh: "罗福莉:OpenClaw、Agent 范式、后训练与卡的分配(3.5 小时)", topics: ["ai"] },
  { vid: "rIwgZWzUKm8", person: "saining-xie", title_zh: "谢赛宁 7 小时马拉松:世界模型、AMI Labs、杨立昆、李飞飞", topics: ["ai"] },
  { vid: "c-ZVu-Cr1FQ", person: "gao-jiyang", title_zh: "高继扬:具身机器人、鲶鱼效应、Waymo 与 Momenta、许华哲的离开", topics: ["ai"] },
];
const SUB_DIR = "/tmp/lucid-subs-zh";

function sh(cmd: string, args: string[]): boolean {
  return spawnSync(cmd, args, { encoding: "utf8" }).status === 0;
}
function slugify(s: string): string {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}
function fetchZhSub(pid: string): string | null {
  fs.mkdirSync(SUB_DIR, { recursive: true });
  const base = [
    "--sleep-requests", "3", "--retries", "10", "--extractor-retries", "5",
    "--extractor-args", "youtube:player_client=tv,web_safari,web",
    "--skip-download", "--write-auto-sub", "--write-sub",
    "--sub-lang", "zh-Hans,zh-Hant,zh-CN,zh",
    "-o", `${SUB_DIR}/%(id)s.%(ext)s`, `https://www.youtube.com/watch?v=${pid}`,
  ];
  if (!sh("yt-dlp", ["--impersonate", "chrome", ...base])) sh("yt-dlp", base);
  const cands = [`${pid}.zh-Hans.vtt`, `${pid}.zh-CN.vtt`, `${pid}.zh.vtt`, `${pid}.zh-Hant.vtt`];
  const found = cands.map((c) => path.join(SUB_DIR, c)).find((p) => fs.existsSync(p) && fs.statSync(p).size > 0);
  if (!found) return null;
  const srt = path.join(SUB_DIR, `${pid}.fixed.srt`);
  if (!sh("ffmpeg", ["-y", "-i", found, srt]) || !fs.existsSync(srt)) return null;
  return srt;
}

async function main() {
  for (const p of PEOPLE) await db.insert(schema.people).values(p).onConflictDoNothing();
  console.log("people ensured");

  let ok = 0, fail = 0, needWhisper = 0;
  for (const v of VIDEOS) {
    try {
      const person = (await db.select().from(schema.people).where(eq(schema.people.slug, v.person)).limit(1))[0];
      const meta = await fetchVideoMetadata(v.vid);
      if (!meta) { console.log(`✗ ${v.vid} 无元数据`); fail++; continue; }
      const slug = slugify(`${person.slug}-${meta.title}`) || `${person.slug}-${v.vid}`;
      const ins = await db.insert(schema.videos).values({
        slug, platform: "youtube", platform_id: v.vid,
        url: `https://www.youtube.com/watch?v=${v.vid}`, cover_url: thumbnailUrl(v.vid, "maxres"),
        title_zh: v.title_zh, title_en: meta.title, person_id: person.id,
        duration_sec: meta.durationSec ?? 0,
        published_at: meta.publishedAt ? new Date(meta.publishedAt) : null, ai_status: "pending",
      }).onConflictDoNothing().returning({ id: schema.videos.id });
      let vid: number;
      if (ins.length === 0) {
        vid = (await db.select({ id: schema.videos.id }).from(schema.videos).where(eq(schema.videos.platform_id, v.vid)).limit(1))[0].id;
      } else {
        vid = ins[0].id;
        for (const ts of v.topics) {
          const t = (await db.select().from(schema.topics).where(eq(schema.topics.slug, ts)).limit(1))[0];
          if (t) await db.insert(schema.videos_topics).values({ video_id: vid, topic_id: t.id }).onConflictDoNothing();
        }
      }
      console.log(`→ [${vid}] ${v.vid} 抓中文 CC...`);
      const srt = fetchZhSub(v.vid);
      if (!srt) { console.log(`  [${vid}] 无 CC — 需 Whisper,跳过`); needWhisper++; continue; }
      const segs = await readSrtFile(srt);
      console.log(`  [${vid}] ${segs.length} 段 · 跑 DeepSeek...`);
      await runPipeline({ video_id: vid, video_title: v.title_zh, srt: segs });
      ok++;
      console.log(`  [${vid}] ✓ ai_done · /zh/videos/${slug}`);
    } catch (e) {
      fail++;
      console.log(`✗ ${v.vid} · ${String(e).slice(0, 140)}`);
    }
  }
  console.log(`[batch-zh] 完成 · ok=${ok} needWhisper=${needWhisper} fail=${fail}`);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
